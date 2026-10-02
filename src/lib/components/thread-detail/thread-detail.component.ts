import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailThread, MailUser, ThreadMessage } from '../../models/mailbox.models';
import { MailQueueService } from '../../services/mail-queue.service';
import { MailLoggerService } from '../../services/mail-logger.service';

/**
 * Seçilen mesajlaşmanın (thread) tüm geçmişini ve yanıt yazma alanını yöneten bileşen.
 * 
 * ⚠️ KRİTİK GÖNDERİM KURALI:
 * - Enter tuşuna basıldığında ASLA mesaj gönderilmez, daima yeni satıra (\n) geçilir.
 * - Ctrl+Enter ve Cmd+Enter kısayolları engellenmiştir.
 * - Mesaj iletimi YALNIZCA açıkça "Gönder" butonuna tıklandığında gerçekleşir.
 */
@Component({
  selector: 'ngx-mail-thread-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-detail-container" *ngIf="thread; else noThreadSelected">
      <!-- Üst Başlık ve Geri Butonu -->
      <div class="mb-detail-header">
        <div class="mb-header-left">
          <button 
            *ngIf="showBackButton" 
            class="mb-btn-back" 
            (click)="back.emit()" 
            title="Listeye Geri Dön">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          
          <div class="mb-header-title-box">
            <h3 class="mb-detail-subject">{{ thread.subject }}</h3>
            <div class="mb-detail-participants">
              Katılımcılar: {{ getParticipantsText() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Mesaj Geçmişi (Kronolojik Akış) -->
      <div class="mb-messages-scroll" #messagesScrollContainer>
        <div 
          *ngFor="let msg of allMessages; trackBy: trackByMessageId" 
          class="mb-message-card"
          [class.mb-mine]="isMyMessage(msg)">
          
          <div class="mb-message-header">
            <div class="mb-sender-avatar">
              {{ getSenderAvatar(msg.sender) }}
            </div>
            <div class="mb-sender-info">
              <span class="mb-sender-name">{{ msg.sender.name }}</span>
              <span class="mb-sender-meta" *ngIf="msg.sender.email"> &lt;{{ msg.sender.email }}&gt;</span>
            </div>
            <span class="mb-message-time">{{ formatTime(msg.sentAt) }}</span>
          </div>

          <!-- Sadece Düz Yazı (Plain Text) Gövde -->
          <div class="mb-message-body">{{ msg.body }}</div>

          <!-- Kuyruk / Gönderim Durumu Göstergesi -->
          <div *ngIf="msg.status === 'pending'" class="mb-message-pending-badge">
            <svg class="mb-spinner" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            <span>Gönderiliyor / Kuyrukta bekliyor...</span>
          </div>
        </div>
      </div>

      <!-- Mesajlaşmayı Sürdür (Yanıt Yazma Alanı) -->
      <div class="mb-reply-box">
        <label class="mb-reply-label">Mesajlaşmayı Sürdür (Düz Metin)</label>
        
        <textarea 
          #replyInput
          class="mb-reply-textarea" 
          rows="3" 
          [(ngModel)]="replyText" 
          (ngModelChange)="onReplyChange($event)"
          (keydown)="onTextareaKeyDown($event)"
          placeholder="Yanıtınızı buraya yazın... (Enter yeni satıra geçer)">
        </textarea>

        <div class="mb-reply-footer">
          <span class="mb-reply-hint">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            Göndermek için 'Gönder' butonuna tıklayın.
          </span>

          <button 
            type="button"
            class="mb-btn-send" 
            [disabled]="!canSend" 
            (click)="onSendClick()"
            title="Mesajı İlet">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            <span>Gönder</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Yazışma Seçilmedi Durumu -->
    <ng-template #noThreadSelected>
      <div class="mb-no-selection">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" class="mb-no-sel-icon">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
        </svg>
        <h4>Mesajlaşma Seçilmedi</h4>
        <p>Görüntülemek ve yanıtlamak için soldaki listeden bir mesajlaşma seçin.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--mb-bg, #ffffff);
      color: var(--mb-text, #202124);
      font-family: inherit;
    }

    .mb-detail-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .mb-detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      background: var(--mb-surface, #f8f9fa);
      flex-shrink: 0;
    }

    .mb-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .mb-btn-back {
      background: transparent;
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--mb-text, #202124);
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .mb-btn-back:hover {
      background: var(--mb-hover-bg, #f1f3f4);
    }

    .mb-header-title-box {
      min-width: 0;
      flex: 1;
    }

    .mb-detail-subject {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--mb-text, #202124);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mb-detail-participants {
      font-size: 12px;
      color: var(--mb-text-muted, #70757a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .mb-messages-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--mb-bg, #ffffff);
    }

    .mb-message-card {
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 10px;
      padding: 14px;
      background: var(--mb-surface, #ffffff);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: border-color 0.2s;
    }

    .mb-message-card.mb-mine {
      border-left: 3px solid var(--mb-primary, #1a73e8);
      background: var(--mb-surface-alt, #fafbfc);
    }

    .mb-message-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .mb-sender-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .mb-sender-info {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: 4px;
      flex-wrap: wrap;
    }

    .mb-sender-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--mb-text, #202124);
    }

    .mb-sender-meta {
      font-size: 11px;
      color: var(--mb-text-muted, #70757a);
    }

    .mb-message-time {
      font-size: 11px;
      color: var(--mb-text-muted, #70757a);
      flex-shrink: 0;
    }

    .mb-message-body {
      font-size: 13px;
      line-height: 1.6;
      color: var(--mb-text, #202124);
      white-space: pre-wrap;
      word-break: break-word;
      user-select: text;
    }

    .mb-message-pending-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #f57c00;
      margin-top: 8px;
      padding: 3px 8px;
      background: #fff3e0;
      border-radius: 4px;
      font-weight: 500;
    }

    .mb-spinner {
      animation: mb-rotate 1s linear infinite;
    }

    @keyframes mb-rotate {
      100% { transform: rotate(360deg); }
    }

    .mb-reply-box {
      border-top: 1px solid var(--mb-border, #e0e2e6);
      padding: 12px 16px;
      background: var(--mb-surface, #f8f9fa);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mb-reply-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mb-text-muted, #70757a);
    }

    .mb-reply-textarea {
      width: 100%;
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      line-height: 1.5;
      font-family: inherit;
      color: var(--mb-text, #202124);
      background: var(--mb-bg, #ffffff);
      resize: vertical;
      min-height: 70px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .mb-reply-textarea:focus {
      border-color: var(--mb-primary, #1a73e8);
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
    }

    .mb-reply-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mb-reply-hint {
      font-size: 11px;
      color: var(--mb-text-muted, #70757a);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mb-btn-send {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }

    .mb-btn-send:hover:not(:disabled) {
      background: var(--mb-primary-hover, #1557b0);
    }

    .mb-btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mb-no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px 20px;
      color: var(--mb-text-muted, #70757a);
    }

    .mb-no-sel-icon {
      opacity: 0.3;
      margin-bottom: 12px;
    }

    .mb-no-selection h4 {
      margin: 0 0 6px 0;
      font-size: 16px;
      color: var(--mb-text, #202124);
    }

    .mb-no-selection p {
      margin: 0;
      font-size: 13px;
      max-width: 320px;
    }
  `]
})
export class MailboxThreadDetailComponent implements OnInit, OnChanges {
  @Input() thread: MailThread | null = null;
  @Input() currentUser!: MailUser;
  @Input() showBackButton: boolean = false;

  @Output() back = new EventEmitter<void>();
  /** Sadece açıkça 'Gönder' butonuna tıklandığında fırlatılır */
  @Output() sendMessage = new EventEmitter<{ threadId: string; body: string }>();

  @ViewChild('messagesScrollContainer') private scrollContainer?: ElementRef;
  @ViewChild('replyInput') private replyInputElement?: ElementRef<HTMLTextAreaElement>;

  replyText = '';

  constructor(
    private queueService: MailQueueService,
    private logger: MailLoggerService
  ) {}

  ngOnInit(): void {
    this.restoreDraft();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['thread'] && this.thread) {
      this.restoreDraft();
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  /**
   * Tüm mesajları (onaylananlar + offline kuyrukta bekleyenler) birleştirir
   */
  get allMessages(): ThreadMessage[] {
    if (!this.thread) return [];
    const pending = this.queueService.getPendingForThread(this.thread.id);
    return [...this.thread.messages, ...pending];
  }

  get canSend(): boolean {
    return !!this.replyText && this.replyText.trim().length > 0;
  }

  /**
   * Klavye olaylarını dinler.
   * Enter: normal satır atlama (\n).
   * Ctrl+Enter / Cmd+Enter: kesinlikle engellenir (kısayolla gönderim yok!).
   */
  onTextareaKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.logger.init('Kısayolla (Ctrl+Enter) gönderim engellendi. Gönder butonu zorunludur.');
      return;
    }
    // Normal Enter serbest bırakılır, textarea varsayılan olarak satır atlar (\n).
  }

  onReplyChange(value: string): void {
    if (this.thread) {
      this.queueService.saveReplyDraft(this.thread.id, value);
    }
  }

  /**
   * YALNIZCA açıkça "Gönder" butonuna tıklandığında çalışır.
   */
  onSendClick(): void {
    if (!this.canSend || !this.thread) return;

    const bodyToSend = this.replyText.trim();
    const threadId = this.thread.id;

    // Taslağı temizle
    this.replyText = '';
    this.queueService.clearReplyDraft(threadId);

    this.logger.event('sendMessage', { threadId, body: bodyToSend });
    this.sendMessage.emit({ threadId, body: bodyToSend });

    setTimeout(() => this.scrollToBottom(), 50);
  }

  isMyMessage(message: ThreadMessage): boolean {
    if (!this.currentUser) return false;
    return String(message.sender.id) === String(this.currentUser.id);
  }

  getSenderAvatar(sender: MailUser): string {
    if (sender.avatarText) return sender.avatarText;
    if (sender.name) {
      const parts = sender.name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return sender.name.substring(0, 2).toUpperCase();
    }
    return 'MK';
  }

  getParticipantsText(): string {
    if (!this.thread?.participants) return '';
    return this.thread.participants.map(p => p.name).join(', ');
  }

  formatTime(dateVal: Date | string): string {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  trackByMessageId(_: number, item: ThreadMessage): string {
    return item.id;
  }

  private restoreDraft(): void {
    if (this.thread) {
      this.replyText = this.queueService.getReplyDraft(this.thread.id);
    } else {
      this.replyText = '';
    }
  }

  private scrollToBottom(): void {
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
