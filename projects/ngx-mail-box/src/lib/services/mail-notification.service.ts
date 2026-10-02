import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MailThread, ThreadMessage } from '../models/mailbox.models';
import { MailLoggerService } from './mail-logger.service';

/**
 * Anlık mesaj bildirimlerini ve okunmamış mesajlaşma sayılarını yöneten reaktif servis.
 * Host uygulama WebSocket veya SignalR üzerinden gelen canlı mesajları bu servise enjekte edebilir.
 */
@Injectable({
  providedIn: 'root'
})
export class MailNotificationService {
  /** Toplam okunmamış mesajlaşma sayısı */
  private unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  /** Canlı gelen yeni mesaj akışı (WebSocket / Push) */
  private incomingMessageSubject = new Subject<{ threadId: string; message: ThreadMessage }>();
  readonly incomingMessage$: Observable<{ threadId: string; message: ThreadMessage }> = this.incomingMessageSubject.asObservable();

  constructor(private logger: MailLoggerService) {}

  /**
   * Okunmamış mesajlaşma sayısını günceller.
   * Genellikle mesajlaşma listesi yüklendiğinde veya değiştiğinde çağrılır.
   */
  updateUnreadCount(threads: MailThread[]): void {
    const unreadCount = threads.filter(t => !t.isRead).length;
    this.unreadCountSubject.next(unreadCount);
    this.logger.network(`Okunmamış mesajlaşma sayısı güncellendi: ${unreadCount}`);
  }

  /**
   * Dışarıdan veya WebSocket üzerinden yeni bir mesaj ulaştığında tetiklenir.
   * Bu metod çağrıldığında dinleyen tüm bileşenler canlı güncellenir.
   * 
   * @param threadId Mesajın ait olduğu yazışma ID'si
   * @param message Gelen tekil mesaj nesnesi
   */
  pushIncomingMessage(threadId: string, message: ThreadMessage): void {
    this.logger.network(`Canlı mesaj alındı (threadId: ${threadId}, messageId: ${message.id})`, message);
    this.incomingMessageSubject.next({ threadId, message });
  }

  /**
   * Güncel okunmamış sayısını anlık olarak okur.
   */
  get currentUnreadCount(): number {
    return this.unreadCountSubject.getValue();
  }
}
