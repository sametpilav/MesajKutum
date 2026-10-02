import { Component, EventEmitter, HostBinding, Inject, Input, OnChanges, OnDestroy, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ConnectionStatus, MailThemeConfig, MailThread, MailUser, MailboxLayoutMode, StartThreadPayload, ThreadMessage } from '../../models/mailbox.models';
import { MailStorageAdapter } from '../../adapters/mail-storage.adapter';
import { MockMailStorageAdapter } from '../../adapters/mock-mail-storage.adapter';
import { MailNotificationService } from '../../services/mail-notification.service';
import { MailQueueService } from '../../services/mail-queue.service';
import { MailLoggerService } from '../../services/mail-logger.service';

import { MailboxThreadListComponent } from '../thread-list/thread-list.component';
import { MailboxThreadDetailComponent } from '../thread-detail/thread-detail.component';
import { MailboxNewThreadComponent } from '../new-thread/new-thread.component';

/**
 * ============================================================================
 * ÇEKİRDEK MESAJLAŞMA KUTUSU BİLEŞENİ (`ngx-mail-box`)
 * ============================================================================
 * 
 * Herhangi bir Angular projesinin sayfasına, modalına veya drawer içine doğrudan
 * eklenebilen ana mesajlaşma arayüzü.
 * 
 * 🤖 LLM KULLANIM ÖRNEĞİ:
 * ```html
 * <ngx-mail-box
 *   [currentUser]="currentUser"
 *   [users]="userList"
 *   [showCloseButton]="true"
 *   (close)="onModalClose()"
 *   (messageSent)="onMessageSent($event)">
 * </ngx-mail-box>
 * ```
 */
@Component({
  selector: 'ngx-mail-box',
  standalone: true,
  imports: [
    CommonModule,
    MailboxThreadListComponent,
    MailboxThreadDetailComponent,
    MailboxNewThreadComponent
  ],
  template: `
    <div 
      class="mb-root-container" 
      [attr.data-layout]="effectiveLayout"
      [class.mb-dark]="isDarkMode">
      
      <!-- Üst Bilgi ve Durum Çubuğu (Gerektiğinde Kapat Butonu & Bağlantı Uyarısı) -->
      <div class="mb-top-bar" *ngIf="showCloseButton || connectionStatus !== 'connected'">
        <div class="mb-status-area">
          <div *ngIf="connectionStatus === 'reconnecting'" class="mb-reconnecting-badge">
            <span class="mb-pulse-dot"></span>
            <span>Ağ koptu, yeniden bağlanılıyor...</span>
          </div>
          <div *ngIf="connectionStatus === 'disconnected'" class="mb-disconnected-badge">
            <span>Çevrimdışı</span>
          </div>
        </div>

        <button 
          *ngIf="showCloseButton" 
          class="mb-btn-top-close" 
          (click)="close.emit()" 
          title="Kapat">
          ✕
        </button>
      </div>

      <!-- Ana İçerik Alanı (Container Queries ile Adaptif) -->
      <div class="mb-content-grid">
        
        <!-- YENİ MESAJLAŞMA FORMU KATMANI -->
        <div *ngIf="isCreatingNewThread" class="mb-pane mb-pane-new">
          <ngx-mail-new-thread
            [users]="users"
            [currentUser]="currentUser"
            (cancel)="isCreatingNewThread = false"
            (startThread)="onStartThread($event)">
          </ngx-mail-new-thread>
        </div>

        <!-- NORMAL MESAJLAŞMALAR GÖRÜNÜMÜ -->
        <ng-container *ngIf="!isCreatingNewThread">
          <!-- 1. SOL PANEL: Mesajlaşmalar Listesi -->
          <div 
            class="mb-pane mb-pane-list" 
            [class.mb-hidden-compact]="effectiveLayout === 'compact' && activeView === 'detail'">
            <ngx-mail-thread-list
              [threads]="threads"
              [selectedThreadId]="selectedThread?.id || null"
              (selectThread)="onSelectThread($event)"
              (startNewThread)="isCreatingNewThread = true">
            </ngx-mail-thread-list>
          </div>

          <!-- 2. SAĞ PANEL: Yazışma Detayı & Yanıt -->
          <div 
            class="mb-pane mb-pane-detail"
            [class.mb-hidden-compact]="effectiveLayout === 'compact' && activeView === 'list'">
            <ngx-mail-thread-detail
              [thread]="selectedThread"
              [currentUser]="currentUser"
              [showBackButton]="effectiveLayout === 'compact'"
              (back)="activeView = 'list'"
              (sendMessage)="onSendMessage($event)">
            </ngx-mail-thread-detail>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      container-type: inline-size;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .mb-root-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--mb-bg, #ffffff);
      color: var(--mb-text, #202124);
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: var(--mb-radius, 8px);
      box-sizing: border-box;
      overflow: hidden;
    }

    /* Koyu Tema Değişkenleri */
    .mb-root-container.mb-dark {
      --mb-bg: #1f1f1f;
      --mb-surface: #2b2b2b;
      --mb-surface-alt: #262626;
      --mb-text: #e8eaed;
      --mb-text-muted: #9aa0a6;
      --mb-border: #3c4043;
      --mb-unread-bg: #2d3748;
      --mb-hover-bg: #323639;
      --mb-selected-bg: #1a365d;
    }

    .mb-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: var(--mb-surface, #f8f9fa);
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      font-size: 12px;
      flex-shrink: 0;
    }

    .mb-status-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mb-reconnecting-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #e65100;
      font-weight: 500;
      font-size: 11px;
    }

    .mb-pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #e65100;
      animation: mb-pulse 1.2s infinite;
    }

    @keyframes mb-pulse {
      0% { opacity: 0.3; }
      50% { opacity: 1; }
      100% { opacity: 0.3; }
    }

    .mb-disconnected-badge {
      color: #c62828;
      font-size: 11px;
      font-weight: 600;
    }

    .mb-btn-top-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--mb-text-muted, #70757a);
      font-size: 14px;
      padding: 4px;
      border-radius: 4px;
    }

    .mb-btn-top-close:hover {
      background: var(--mb-hover-bg, #f1f3f4);
    }

    .mb-content-grid {
      flex: 1;
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .mb-pane {
      height: 100%;
      overflow: hidden;
    }

    .mb-pane-new {
      width: 100%;
    }

    /* Container Queries: Varsayılan Geniş Görünüm (>= 650px) */
    .mb-pane-list {
      width: 320px;
      border-right: 1px solid var(--mb-border, #e0e2e6);
      flex-shrink: 0;
    }

    .mb-pane-detail {
      flex: 1;
      min-width: 0;
    }

    /* Dar Kapsayıcı (< 650px) veya compact mod */
    @container (max-width: 649px) {
      .mb-pane-list {
        width: 100%;
        border-right: none;
      }
      .mb-pane-detail {
        width: 100%;
      }
      .mb-hidden-compact {
        display: none !important;
      }
    }

    /* Zorlanmış 'compact' modu */
    .mb-root-container[data-layout="compact"] .mb-pane-list {
      width: 100%;
      border-right: none;
    }
    .mb-root-container[data-layout="compact"] .mb-pane-detail {
      width: 100%;
    }
    .mb-root-container[data-layout="compact"] .mb-hidden-compact {
      display: none !important;
    }

    /* Zorlanmış 'split' modu */
    .mb-root-container[data-layout="split"] .mb-pane-list {
      width: 320px;
      border-right: 1px solid var(--mb-border, #e0e2e6);
      display: block !important;
    }
    .mb-root-container[data-layout="split"] .mb-pane-detail {
      display: block !important;
    }
  `]
})
export class NgxMailBoxComponent implements OnInit, OnChanges, OnDestroy {
  /** Aktif oturum açmış kullanıcı (Gönderen olarak atanır) */
  @Input({ required: true }) currentUser!: MailUser;

  /** Yeni mesajlaşma başlatırken seçilebilecek kullanıcılar listesi */
  @Input() users: MailUser[] = [];

  /** 
   * Yerleşim modu.
   * - 'auto': Bulunduğu kutunun genişliğine göre karar verir (Container Query)
   * - 'compact': Her zaman tek sütun (mobil/popup uyumlu)
   * - 'split': Her zaman yan yana çift panel
   */
  @Input() layout: MailboxLayoutMode = 'auto';

  /** Üst çubukta kapatma butonu ('✕') gösterilsin mi? (Örn: Modal içinde) */
  @Input() showCloseButton = false;

  /** 
   * Tema modu veya özel renk yapılandırması ('light', 'dark' veya MailThemeConfig)
   */
  @Input() theme: 'light' | 'dark' | MailThemeConfig = 'light';

  /** 
   * Konsol hata ayıklama modunu açar.
   * LLM ve geliştiriciler konsoldan tüm akışı etiketli izleyebilir.
   */
  @Input() debugMode = false;

  /** Popup / pencere kapatma talebi çıktısı */
  @Output() close = new EventEmitter<void>();

  /** Yeni bir yazışma başlatıldığında fırlatılır */
  @Output() threadStarted = new EventEmitter<MailThread>();

  /** 
   * Bir yanıta açıkça "Gönder" butonuna tıklandığında fırlatılır.
   * Enter tuşu kısayol DEĞİLDİR, satır atlar.
   */
  @Output() messageSent = new EventEmitter<{ threadId: string; body: string }>();

  /** Okunmamış mesajlaşma sayısı değiştiğinde fırlatılır */
  @Output() unreadCountChange = new EventEmitter<number>();

  threads: MailThread[] = [];
  selectedThread: MailThread | null = null;
  activeView: 'list' | 'detail' = 'list';
  isCreatingNewThread = false;
  connectionStatus: ConnectionStatus = 'connected';

  private adapter: MailStorageAdapter;
  private subs = new Subscription();

  constructor(
    @Optional() customAdapter: MailStorageAdapter,
    defaultMockAdapter: MockMailStorageAdapter,
    private notificationService: MailNotificationService,
    private queueService: MailQueueService,
    private logger: MailLoggerService
  ) {
    // Dışarıdan özel bir adaptör enjekte edilmişse onu kullan, yoksa mock adaptörü kullan
    this.adapter = customAdapter || defaultMockAdapter;
  }

  ngOnInit(): void {
    this.logger.setDebugMode(this.debugMode);
    this.logger.init('NgxMailBoxComponent başlatıldı.', {
      currentUser: this.currentUser,
      userCount: this.users.length,
      layout: this.layout
    });

    this.applyTheme();
    this.loadThreads();
    this.listenToAdapterEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['debugMode']) {
      this.logger.setDebugMode(this.debugMode);
    }
    if (changes['theme']) {
      this.applyTheme();
    }
    if (changes['currentUser'] && !changes['currentUser'].firstChange) {
      this.loadThreads();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get effectiveLayout(): MailboxLayoutMode {
    return this.layout;
  }

  get isDarkMode(): boolean {
    if (typeof this.theme === 'string') {
      return this.theme === 'dark';
    }
    return this.theme?.mode === 'dark';
  }

  onSelectThread(thread: MailThread): void {
    this.selectedThread = thread;
    this.activeView = 'detail';

    if (!thread.isRead) {
      thread.isRead = true;
      this.adapter.markAsRead(thread.id).subscribe();
      this.notificationService.updateUnreadCount(this.threads);
      this.unreadCountChange.emit(this.notificationService.currentUnreadCount);
    }
  }

  onStartThread(payload: StartThreadPayload): void {
    this.adapter.startThread(payload).subscribe({
      next: (newThread) => {
        this.threads = [newThread, ...this.threads];
        this.selectedThread = newThread;
        this.isCreatingNewThread = false;
        this.activeView = 'detail';
        this.threadStarted.emit(newThread);
        this.notificationService.updateUnreadCount(this.threads);
        this.unreadCountChange.emit(this.notificationService.currentUnreadCount);
      },
      error: (err) => {
        this.logger.error('startThread hatası', err);
      }
    });
  }

  /**
   * Sadece açıkça 'Gönder' butonuna basıldığında tetiklenir.
   */
  onSendMessage(event: { threadId: string; body: string }): void {
    const thread = this.threads.find(t => t.id === event.threadId);
    if (!thread) return;

    // Ağ kopuksa offline kuyruğa al
    if (this.connectionStatus !== 'connected') {
      const tempMsg: ThreadMessage = {
        id: 'pending-' + Date.now(),
        threadId: event.threadId,
        sender: this.currentUser,
        body: event.body,
        sentAt: new Date().toISOString(),
        status: 'pending'
      };
      this.queueService.enqueue(tempMsg);
      this.messageSent.emit(event);
      return;
    }

    // Normal sunucuya iletim
    this.adapter.sendMessage(event.threadId, event.body).subscribe({
      next: (savedMsg) => {
        thread.messages = [...thread.messages, savedMsg];
        thread.lastUpdated = savedMsg.sentAt;
        // Listede en üste taşı
        this.threads = [thread, ...this.threads.filter(t => t.id !== thread.id)];
        this.messageSent.emit(event);
        this.logger.event('messageSent', savedMsg);
      },
      error: (err) => {
        this.logger.error('Mesaj gönderilemedi, kuyruğa alınıyor', err);
        const tempMsg: ThreadMessage = {
          id: 'pending-' + Date.now(),
          threadId: event.threadId,
          sender: this.currentUser,
          body: event.body,
          sentAt: new Date().toISOString(),
          status: 'pending'
        };
        this.queueService.enqueue(tempMsg);
      }
    });
  }

  private loadThreads(): void {
    if (!this.currentUser) return;
    this.adapter.getThreads(this.currentUser.id).subscribe({
      next: (data) => {
        this.threads = data;
        this.notificationService.updateUnreadCount(this.threads);
        this.unreadCountChange.emit(this.notificationService.currentUnreadCount);

        // Geniş ekranda ilk mesajlaşmayı otomatik seç
        if (this.effectiveLayout === 'split' && this.threads.length > 0 && !this.selectedThread) {
          this.selectedThread = this.threads[0];
        }
      },
      error: (err) => {
        this.logger.error('getThreads hatası', err);
      }
    });
  }

  private listenToAdapterEvents(): void {
    // Bağlantı durumu takibi
    this.subs.add(
      this.adapter.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
        this.logger.network(`Bağlantı durumu değişti: ${status}`);
        
        // Bağlantı tekrar kurulduğunda offline kuyruğu boşalt
        if (status === 'connected') {
          this.flushOfflineQueue();
        }
      })
    );

    // Canlı gelen yeni mesaj akışı (WebSocket / SSE)
    this.subs.add(
      this.adapter.listenIncomingMessages().subscribe(({ threadId, message }) => {
        this.handleIncomingMessage(threadId, message);
      })
    );
  }

  private handleIncomingMessage(threadId: string, message: ThreadMessage): void {
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) {
      thread.messages = [...thread.messages, message];
      thread.lastUpdated = message.sentAt;
      
      // Eğer bu thread açık değilse okunmamış yap
      if (this.selectedThread?.id !== threadId || this.activeView !== 'detail') {
        thread.isRead = false;
      }
      
      // En üste taşı
      this.threads = [thread, ...this.threads.filter(t => t.id !== thread.id)];
    }
    
    this.notificationService.updateUnreadCount(this.threads);
    this.unreadCountChange.emit(this.notificationService.currentUnreadCount);
  }

  private flushOfflineQueue(): void {
    // Bekleyen mesajları sırayla gönder
    if (!this.selectedThread) return;
    const pendingList = this.queueService.getPendingForThread(this.selectedThread.id);
    
    pendingList.forEach(item => {
      this.adapter.sendMessage(item.threadId, item.body).subscribe({
        next: (saved) => {
          this.queueService.dequeue(item.id);
          const thread = this.threads.find(t => t.id === item.threadId);
          if (thread) {
            thread.messages.push(saved);
          }
        }
      });
    });
  }

  private applyTheme(): void {
    if (typeof this.theme === 'object') {
      const el = document.documentElement;
      if (this.theme.primaryColor) el.style.setProperty('--mb-primary', this.theme.primaryColor);
      if (this.theme.primaryHoverColor) el.style.setProperty('--mb-primary-hover', this.theme.primaryHoverColor);
      if (this.theme.surfaceColor) el.style.setProperty('--mb-surface', this.theme.surfaceColor);
      if (this.theme.backgroundColor) el.style.setProperty('--mb-bg', this.theme.backgroundColor);
      if (this.theme.textColor) el.style.setProperty('--mb-text', this.theme.textColor);
      if (this.theme.borderColor) el.style.setProperty('--mb-border', this.theme.borderColor);
    }
  }
}
