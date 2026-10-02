import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailUser, StartThreadPayload } from '../../models/mailbox.models';
import { MailQueueService } from '../../services/mail-queue.service';
import { MailLoggerService } from '../../services/mail-logger.service';

/**
 * Yeni bir mesajlaşma başlatma formu bileşeni.
 * Alıcı seçimi (dışarıdan verilen kullanıcı listesinden), konu başlığı
 * ve ilk düz yazı mesajını alarak yeni bir thread başlatır.
 */
@Component({
  selector: 'ngx-mail-new-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-new-thread-container">
      <!-- Üst Başlık Çubuğu -->
      <div class="mb-new-thread-header">
        <div class="mb-header-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>Yeni Mesajlaşma Başlat</span>
        </div>
        <button class="mb-btn-close" (click)="cancel.emit()" title="Vazgeç">✕</button>
      </div>

      <!-- Form Alanları -->
      <div class="mb-new-thread-body">
        <!-- Alıcı Seçimi -->
        <div class="mb-form-group">
          <label class="mb-form-label">Kime (Alıcı):</label>
          <div class="mb-select-wrapper">
            <select 
              class="mb-form-select" 
              [(ngModel)]="selectedRecipientId"
              (ngModelChange)="onDraftChange()">
              <option [ngValue]="null" disabled selected>Alıcı seçiniz...</option>
              <option *ngFor="let user of selectableUsers" [ngValue]="user.id">
                {{ user.name }} {{ user.email ? '(' + user.email + ')' : '' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Konu Başlığı -->
        <div class="mb-form-group">
          <label class="mb-form-label">Konu:</label>
          <input 
            type="text" 
            class="mb-form-input" 
            [(ngModel)]="subject" 
            (ngModelChange)="onDraftChange()"
            placeholder="Mesajlaşma konusunu yazın..." />
        </div>

        <!-- İlk Mesaj Metni -->
        <div class="mb-form-group mb-flex-grow">
          <label class="mb-form-label">İlk Mesaj (Düz Yazı):</label>
          <textarea 
            class="mb-form-textarea" 
            rows="6"
            [(ngModel)]="firstMessage" 
            (ngModelChange)="onDraftChange()"
            (keydown)="onTextareaKeyDown($event)"
            placeholder="Mesajınızı buraya yazın... (Enter yeni satıra geçer)">
          </textarea>
        </div>
      </div>

      <!-- Alt Aksiyon Butonları -->
      <div class="mb-new-thread-footer">
        <span class="mb-footer-hint">
          Enter tuşu yeni satıra geçer.
        </span>

        <div class="mb-footer-actions">
          <button type="button" class="mb-btn-cancel" (click)="cancel.emit()">
            Vazgeç
          </button>
          
          <button 
            type="button" 
            class="mb-btn-submit" 
            [disabled]="!isValid" 
            (click)="onSubmit()">
            <span>Mesajlaşmayı Başlat</span>
          </button>
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

    .mb-new-thread-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .mb-new-thread-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--mb-border, #e0e2e6);
      background: var(--mb-surface, #f8f9fa);
      flex-shrink: 0;
    }

    .mb-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--mb-text, #202124);
    }

    .mb-btn-close {
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: var(--mb-text-muted, #70757a);
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mb-btn-close:hover {
      background: var(--mb-hover-bg, #f1f3f4);
    }

    .mb-new-thread-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .mb-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .mb-form-group.mb-flex-grow {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .mb-form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--mb-text, #202124);
    }

    .mb-form-input,
    .mb-form-select {
      width: 100%;
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--mb-text, #202124);
      background: var(--mb-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .mb-form-input:focus,
    .mb-form-select:focus,
    .mb-form-textarea:focus {
      border-color: var(--mb-primary, #1a73e8);
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
    }

    .mb-form-textarea {
      flex: 1;
      min-height: 120px;
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 6px;
      padding: 10px;
      font-size: 13px;
      line-height: 1.5;
      font-family: inherit;
      color: var(--mb-text, #202124);
      background: var(--mb-bg, #ffffff);
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }

    .mb-new-thread-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--mb-border, #e0e2e6);
      background: var(--mb-surface, #f8f9fa);
      flex-shrink: 0;
    }

    .mb-footer-hint {
      font-size: 11px;
      color: var(--mb-text-muted, #70757a);
    }

    .mb-footer-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mb-btn-cancel {
      background: transparent;
      border: 1px solid var(--mb-border, #e0e2e6);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 13px;
      cursor: pointer;
      color: var(--mb-text, #202124);
    }

    .mb-btn-cancel:hover {
      background: var(--mb-hover-bg, #f1f3f4);
    }

    .mb-btn-submit {
      background: var(--mb-primary, #1a73e8);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }

    .mb-btn-submit:hover:not(:disabled) {
      background: var(--mb-primary-hover, #1557b0);
    }

    .mb-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class MailboxNewThreadComponent implements OnInit {
  @Input() users: MailUser[] = [];
  @Input() currentUser!: MailUser;

  @Output() cancel = new EventEmitter<void>();
  @Output() startThread = new EventEmitter<StartThreadPayload>();

  selectedRecipientId: string | number | null = null;
  subject = '';
  firstMessage = '';

  constructor(
    private queueService: MailQueueService,
    private logger: MailLoggerService
  ) {}

  ngOnInit(): void {
    // Taslak hafızasını geri yükle
    const draft = this.queueService.getNewThreadDraft();
    if (draft.recipientId) this.selectedRecipientId = draft.recipientId;
    if (draft.subject) this.subject = draft.subject;
    if (draft.body) this.firstMessage = draft.body;
  }

  get selectableUsers(): MailUser[] {
    if (!this.currentUser) return this.users;
    return this.users.filter(u => String(u.id) !== String(this.currentUser.id));
  }

  get isValid(): boolean {
    return (
      this.selectedRecipientId !== null &&
      this.subject.trim().length > 0 &&
      this.firstMessage.trim().length > 0
    );
  }

  onTextareaKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.logger.init('Kısayolla gönderme engellendi. Açıkça butona tıklanmalıdır.');
    }
  }

  onDraftChange(): void {
    this.queueService.saveNewThreadDraft({
      recipientId: this.selectedRecipientId || undefined,
      subject: this.subject,
      body: this.firstMessage
    });
  }

  onSubmit(): void {
    if (!this.isValid) return;

    const recipient = this.users.find(u => String(u.id) === String(this.selectedRecipientId));
    if (!recipient) return;

    const payload: StartThreadPayload = {
      recipient,
      subject: this.subject.trim(),
      firstMessage: this.firstMessage.trim()
    };

    // Taslağı temizle
    this.queueService.clearNewThreadDraft();
    this.subject = '';
    this.firstMessage = '';
    this.selectedRecipientId = null;

    this.logger.event('startThread', payload);
    this.startThread.emit(payload);
  }
}
