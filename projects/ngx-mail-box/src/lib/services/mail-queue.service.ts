import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThreadMessage } from '../models/mailbox.models';
import { MailLoggerService } from './mail-logger.service';

export interface PendingQueueItem {
  message: ThreadMessage;
  retryAttempts: number;
}

/**
 * Ağ kopması veya sunucu hatalarında kullanıcının yazdığı ve "Gönder" butonuna bastığı
 * mesajları hafızada tutan (in-memory offline queue) ve taslakları (draft) saklayan servis.
 */
@Injectable({
  providedIn: 'root'
})
export class MailQueueService {
  /** Kuyrukta bekleyen mesajların listesi */
  private pendingQueue$ = new BehaviorSubject<PendingQueueItem[]>([]);
  
  /** Yazışma bazlı taslak metin saklama deposu (threadId -> draft text) */
  private draftsMap = new Map<string, string>();
  
  /** Yeni başlatılan mesajlaşma taslağı */
  private newThreadDraft: { recipientId?: string | number; subject?: string; body?: string } = {};

  constructor(private logger: MailLoggerService) {}

  /**
   * Kuyruk akışını döner.
   */
  getPendingQueue(): Observable<PendingQueueItem[]> {
    return this.pendingQueue$.asObservable();
  }

  /**
   * Bir mesajı offline kuyruğa ekler.
   */
  enqueue(message: ThreadMessage): void {
    const current = this.pendingQueue$.getValue();
    const updated = [...current, { message, retryAttempts: 0 }];
    this.pendingQueue$.next(updated);
    this.logger.queue(`Mesaj kuyruğa alındı (id: ${message.id}). Toplam kuyruk: ${updated.length}`, message);
  }

  /**
   * Başarıyla iletilen bir mesajı kuyruktan kaldırır.
   */
  dequeue(messageId: string): void {
    const current = this.pendingQueue$.getValue();
    const updated = current.filter(item => item.message.id !== messageId);
    this.pendingQueue$.next(updated);
    this.logger.queue(`Mesaj kuyruktan çıkarıldı (id: ${messageId}). Kalan kuyruk: ${updated.length}`);
  }

  /**
   * Kuyrukta belirli bir yazışmaya ait bekleyen mesajları döner.
   */
  getPendingForThread(threadId: string): ThreadMessage[] {
    return this.pendingQueue$.getValue()
      .filter(item => item.message.threadId === threadId)
      .map(item => item.message);
  }

  /**
   * Bir yazışma için yazılan yanıt taslağını kaydeder (popup küçültüldüğünde veri kaybolmaz).
   */
  saveReplyDraft(threadId: string, text: string): void {
    if (!text || text.trim() === '') {
      this.draftsMap.delete(threadId);
    } else {
      this.draftsMap.set(threadId, text);
    }
  }

  /**
   * Kaydedilmiş yanıt taslağını döner.
   */
  getReplyDraft(threadId: string): string {
    return this.draftsMap.get(threadId) || '';
  }

  /**
   * Yanıt taslağını temizler (başarıyla gönderildikten sonra).
   */
  clearReplyDraft(threadId: string): void {
    this.draftsMap.delete(threadId);
  }

  /**
   * Yeni mesajlaşma formu taslağını kaydeder.
   */
  saveNewThreadDraft(draft: { recipientId?: string | number; subject?: string; body?: string }): void {
    this.newThreadDraft = draft;
  }

  /**
   * Yeni mesajlaşma formu taslağını getirir.
   */
  getNewThreadDraft(): { recipientId?: string | number; subject?: string; body?: string } {
    return this.newThreadDraft;
  }

  /**
   * Yeni mesajlaşma formu taslağını sıfırlar.
   */
  clearNewThreadDraft(): void {
    this.newThreadDraft = {};
  }
}
