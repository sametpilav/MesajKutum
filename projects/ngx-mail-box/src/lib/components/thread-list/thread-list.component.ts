import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailThread } from '../../models/mailbox.models';

/**
 * Kullanıcının dahil olduğu tüm aktif mesajlaşmaları (threads) listeleyen bileşen.
 * Gmail tarzı konu başlığı, son mesaj önizlemesi ve okunmamış durumunu gösterir.
 */
@Component({
  selector: 'ngx-mail-thread-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-thread-list-container">
      <!-- Arama ve Yeni Mesajlaşma Butonu Üst Çubuğu -->
      <div class="mb-list-header">
        <div class="mb-search-box">
          <svg class="mb-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Mesajlarda ara..." 
            class="mb-search-input" />
          <button 
            *ngIf="searchQuery" 
            (click)="searchQuery = ''" 
            class="mb-search-clear" 
            title="Temizle">✕</button>
        </div>

        <button 
          class="mb-btn-new-thread" 
          (click)="startNewThread.emit()" 
          title="Yeni Mesajlaşma Başlat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>Yeni</span>
        </button>
      </div>

      <!-- Mesajlaşmalar Listesi -->
      <div class="mb-list-scroll">
        <div *ngIf="filteredThreads.length === 0" class="mb-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" class="mb-empty-icon">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <p class="mb-empty-title">Mesajlaşma bulunamadı</p>
          <p class="mb-empty-desc">Yeni bir mesajlaşma başlatarak yazışmaya başlayabilirsiniz.</p>
        </div>

        <div 
          *ngFor="let thread of filteredThreads" 
          class="mb-thread-item" 
          [class.mb-unread]="!thread.isRead"
          [class.mb-selected]="selectedThreadId === thread.id"
          (click)="selectThread.emit(thread)">
          
          <!-- Avatar / Harf İkonu -->
          <div class="mb-thread-avatar">
            {{ getThreadAvatar(thread) }}
          </div>

          <!-- İçerik Bloğu -->
          <div class="mb-thread-content">
            <div class="mb-thread-top-row">
              <span class="mb-thread-participant">{{ getParticipantsText(thread) }}</span>
              <span class="mb-thread-date">{{ formatDate(thread.lastUpdated) }}</span>
            </div>

            <div class="mb-thread-subject-row">
              <span class="mb-thread-subject">{{ thread.subject }}</span>
              <span *ngIf="!thread.isRead" class="mb-unread-dot" title="Okunmamış mesaj"></span>
            </div>

            <div class="mb-thread-snippet">
              {{ getLastMessageSnippet(thread) }}
            </div>
          </div>
        </div>
      </div>
    </div>
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

    .mb-thread-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .mb-list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      background: var(--mb-surface, #f8f9fa);
    }

    .mb-search-box {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--mb-bg, #ffffff);
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 8px;
      padding: 6px 10px;
      gap: 6px;
      transition: border-color 0.2s;
    }

    .mb-search-box:focus-within {
      border-color: var(--mb-primary, #1a73e8);
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
    }

    .mb-icon {
      color: var(--mb-text-muted, #70757a);
      flex-shrink: 0;
    }

    .mb-search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 13px;
      width: 100%;
      color: inherit;
    }

    .mb-search-clear {
      border: none;
      background: transparent;
      color: var(--mb-text-muted, #70757a);
      cursor: pointer;
      font-size: 12px;
      padding: 0 4px;
    }

    .mb-btn-new-thread {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      flex-shrink: 0;
    }

    .mb-btn-new-thread:hover {
      background: var(--mb-primary-hover, #1557b0);
    }

    .mb-btn-new-thread:active {
      transform: scale(0.98);
    }

    .mb-list-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .mb-thread-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      cursor: pointer;
      transition: background 0.15s ease;
      position: relative;
    }

    .mb-thread-item:hover {
      background: var(--mb-hover-bg, #f1f3f4);
    }

    .mb-thread-item.mb-selected {
      background: var(--mb-selected-bg, #e8f0fe);
    }

    .mb-thread-item.mb-unread {
      background: var(--mb-unread-bg, #f2f6fc);
    }

    .mb-thread-item.mb-unread .mb-thread-subject {
      font-weight: 700;
      color: var(--mb-text, #202124);
    }

    .mb-thread-item.mb-unread .mb-thread-participant {
      font-weight: 700;
    }

    .mb-thread-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .mb-thread-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mb-thread-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }

    .mb-thread-participant {
      font-size: 13px;
      color: var(--mb-text, #202124);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mb-thread-date {
      font-size: 11px;
      color: var(--mb-text-muted, #70757a);
      flex-shrink: 0;
    }

    .mb-thread-subject-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    .mb-thread-subject {
      font-size: 13px;
      font-weight: 500;
      color: var(--mb-text, #202124);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mb-unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mb-primary, #1a73e8);
      flex-shrink: 0;
    }

    .mb-thread-snippet {
      font-size: 12px;
      color: var(--mb-text-muted, #70757a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mb-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--mb-text-muted, #70757a);
    }

    .mb-empty-icon {
      opacity: 0.4;
      margin-bottom: 12px;
    }

    .mb-empty-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--mb-text, #202124);
    }

    .mb-empty-desc {
      font-size: 12px;
      margin: 0;
    }
  `]
})
export class MailboxThreadListComponent {
  @Input() threads: MailThread[] = [];
  @Input() selectedThreadId: string | null = null;

  @Output() selectThread = new EventEmitter<MailThread>();
  @Output() startNewThread = new EventEmitter<void>();

  searchQuery = '';

  get filteredThreads(): MailThread[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.threads;
    }
    const q = this.searchQuery.toLowerCase();
    return this.threads.filter(t => 
      t.subject.toLowerCase().includes(q) ||
      t.participants.some(p => p.name.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q))) ||
      t.messages.some(m => m.body.toLowerCase().includes(q))
    );
  }

  getThreadAvatar(thread: MailThread): string {
    const firstP = thread.participants[0];
    if (firstP?.avatarText) return firstP.avatarText;
    if (firstP?.name) {
      const parts = firstP.name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return firstP.name.substring(0, 2).toUpperCase();
    }
    return 'MK';
  }

  getParticipantsText(thread: MailThread): string {
    if (!thread.participants || thread.participants.length === 0) return 'Bilinmiyor';
    return thread.participants.map(p => p.name).join(', ');
  }

  getLastMessageSnippet(thread: MailThread): string {
    if (!thread.messages || thread.messages.length === 0) return 'Mesaj yok';
    const lastMsg = thread.messages[thread.messages.length - 1];
    return lastMsg.body ? lastMsg.body.replace(/\n/g, ' ') : '';
  }

  formatDate(dateVal: Date | string): string {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
