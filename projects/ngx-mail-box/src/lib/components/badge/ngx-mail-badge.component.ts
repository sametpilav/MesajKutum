import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MailNotificationService } from '../../services/mail-notification.service';

/**
 * Host projenin üst barında (Navbar), menüsünde veya herhangi bir yerinde
 * kullanılabilen bağımsız okunmamış mesajlaşma rozeti.
 * 
 * @example
 * <ngx-mail-badge (badgeClick)="openMyMessageModal()"></ngx-mail-badge>
 */
@Component({
  selector: 'ngx-mail-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      type="button" 
      class="mb-badge-btn" 
      (click)="badgeClick.emit()" 
      title="Mesajlaşmalar">
      
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>

      <span *ngIf="unreadCount > 0" class="mb-badge-count">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .mb-badge-btn {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      color: inherit;
      padding: 6px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, transform 0.1s;
    }

    .mb-badge-btn:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .mb-badge-btn:active {
      transform: scale(0.95);
    }

    .mb-badge-count {
      position: absolute;
      top: 0;
      right: 0;
      background: #d93025;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      box-sizing: border-box;
      border: 2px solid #ffffff;
      line-height: 1;
    }
  `]
})
export class NgxMailBadgeComponent {
  /** Rozete tıklandığında fırlatılır (popup veya modalı açmak için kullanılabilir) */
  @Output() badgeClick = new EventEmitter<void>();

  constructor(private notificationService: MailNotificationService) {}

  get unreadCount(): number {
    return this.notificationService.currentUnreadCount;
  }
}
