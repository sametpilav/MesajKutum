import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MailThemeConfig, MailThread, MailUser } from '../../models/mailbox.models';
import { MailNotificationService } from '../../services/mail-notification.service';
import { NgxMailBoxComponent } from '../mailbox-box/ngx-mail-box.component';

/**
 * ============================================================================
 * SAĞ ALTA SABİTLENEN HAZIR DOCKED POPUP BİLEŞENİ (`ngx-mail-docked-popup`)
 * ============================================================================
 * 
 * Host projenin hiçbir modal, dialog veya CSS konumlandırma kodu yazmasına
 * gerek kalmadan, doğrudan sağ altta açılıp kapanan mesajlaşma penceresi sunar.
 * 
 * 🤖 LLM TEK SATIR ENTEGRASYON KODU:
 * ```html
 * <ngx-mail-docked-popup
 *   [currentUser]="currentUser"
 *   [users]="userList"
 *   [debugMode]="true">
 * </ngx-mail-docked-popup>
 * ```
 */
@Component({
  selector: 'ngx-mail-docked-popup',
  standalone: true,
  imports: [CommonModule, NgxMailBoxComponent],
  template: `
    <div class="mb-docked-wrapper" [class.mb-dark]="isDarkMode">
      
      <!-- 1. AÇILIR MESAJLAŞMA PENCERESİ (Açık veya Simge Durumunda) -->
      <div 
        class="mb-docked-window" 
        *ngIf="isOpen"
        [class.mb-minimized]="isMinimized">
        
        <!-- Pencere Başlık Çubuğu -->
        <div class="mb-window-header" (click)="toggleMinimize()">
          <div class="mb-header-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span class="mb-title-text">{{ title }}</span>
            <span *ngIf="unreadCount > 0" class="mb-title-badge">{{ unreadCount }}</span>
          </div>

          <div class="mb-window-actions" (click)="$event.stopPropagation()">
            <!-- Küçült / Büyüt Butonu -->
            <button 
              type="button" 
              class="mb-btn-window" 
              (click)="toggleMinimize()" 
              [title]="isMinimized ? 'Pencereyi Aç' : 'Simge Durumuna Küçült'">
              {{ isMinimized ? '▢' : '—' }}
            </button>
            
            <!-- Kapat Butonu -->
            <button 
              type="button" 
              class="mb-btn-window mb-btn-close" 
              (click)="closePopup()" 
              title="Kapat">
              ✕
            </button>
          </div>
        </div>

        <!-- Pencere Gövdesi (Çekirdek Mesajlaşma Kutusu) -->
        <div class="mb-window-body" *ngIf="!isMinimized">
          <ngx-mail-box
            [currentUser]="currentUser"
            [users]="users"
            [theme]="theme"
            [layout]="'compact'"
            [debugMode]="debugMode"
            [showCloseButton]="false"
            (messageSent)="messageSent.emit($event)"
            (threadStarted)="threadStarted.emit($event)"
            (unreadCountChange)="unreadCountChange.emit($event)">
          </ngx-mail-box>
        </div>
      </div>

      <!-- 2. SAĞ ALT YÜZEN BİLDİRİM BUTONU (FAB) -->
      <button 
        type="button" 
        class="mb-fab-trigger" 
        *ngIf="!isOpen" 
        (click)="openPopup()"
        title="Mesajlaşmaları Aç">
        
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>

        <!-- Canlı Okunmamış Rozeti -->
        <span *ngIf="unreadCount > 0" class="mb-fab-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

    </div>
  `,
  styles: [`
    .mb-docked-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Yüzen Buton (FAB) */
    .mb-fab-trigger {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }

    .mb-fab-trigger:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
    }

    .mb-fab-trigger:active {
      transform: scale(0.96);
    }

    .mb-fab-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #d93025;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      box-sizing: border-box;
      border: 2px solid #ffffff;
      animation: mb-badge-bounce 0.3s ease;
    }

    @keyframes mb-badge-bounce {
      0% { transform: scale(0.5); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Açılır Pencere (Docked Window) */
    .mb-docked-window {
      width: 400px;
      height: 580px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 48px);
      background: var(--mb-bg, #ffffff);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--mb-border, #e0e2e6);
      animation: mb-slide-up 0.25s cubic-bezier(0, 0, 0.2, 1);
    }

    .mb-docked-window.mb-minimized {
      height: 48px;
      width: 320px;
      border-radius: 10px 10px 0 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }

    @keyframes mb-slide-up {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Başlık Çubuğu */
    .mb-window-header {
      height: 48px;
      background: var(--mb-surface, #f8f9fa);
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }

    .mb-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mb-text, #202124);
      font-size: 14px;
      font-weight: 600;
    }

    .mb-title-badge {
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 10px;
    }

    .mb-window-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mb-btn-window {
      background: transparent;
      border: none;
      color: var(--mb-text-muted, #70757a);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: background 0.15s, color 0.15s;
    }

    .mb-btn-window:hover {
      background: var(--mb-hover-bg, #f1f3f4);
      color: var(--mb-text, #202124);
    }

    .mb-btn-close:hover {
      background: #fce8e6;
      color: #d93025;
    }

    .mb-window-body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Mobil Ekranlar İçin Düzen */
    @media (max-width: 480px) {
      .mb-docked-wrapper {
        bottom: 12px;
        right: 12px;
      }
      .mb-docked-window {
        width: calc(100vw - 24px);
        height: calc(100vh - 80px);
      }
    }
  `]
})
export class NgxMailDockedPopupComponent {
  /** Aktif kullanıcı bilgisi */
  @Input({ required: true }) currentUser!: MailUser;

  /** Yeni mesajlaşma başlatırken seçilebilecek kullanıcı listesi */
  @Input() users: MailUser[] = [];

  /** Pencere başlık metni */
  @Input() title = 'Mesajlaşmalarım';

  /** Tema modu ('light', 'dark' veya MailThemeConfig) */
  @Input() theme: 'light' | 'dark' | MailThemeConfig = 'light';

  /** Konsol loglama modu */
  @Input() debugMode = false;

  /** Başlangıçta açık başlasın mı? */
  @Input() defaultOpen = false;

  /** Açıkça "Gönder" butonuna basıldığında fırlatılır */
  @Output() messageSent = new EventEmitter<{ threadId: string; body: string }>();

  /** Yeni mesajlaşma başlatıldığında fırlatılır */
  @Output() threadStarted = new EventEmitter<MailThread>();

  /** Okunmamış sayaç değiştiğinde fırlatılır */
  @Output() unreadCountChange = new EventEmitter<number>();

  isOpen = false;
  isMinimized = false;

  constructor(public notificationService: MailNotificationService) {
    if (this.defaultOpen) {
      this.isOpen = true;
    }
  }

  get unreadCount(): number {
    return this.notificationService.currentUnreadCount;
  }

  get isDarkMode(): boolean {
    if (typeof this.theme === 'string') {
      return this.theme === 'dark';
    }
    return this.theme?.mode === 'dark';
  }

  openPopup(): void {
    this.isOpen = true;
    this.isMinimized = false;
  }

  closePopup(): void {
    this.isOpen = false;
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }
}
