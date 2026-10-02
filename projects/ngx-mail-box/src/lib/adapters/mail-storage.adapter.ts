import { Observable } from 'rxjs';
import { ConnectionStatus, MailThread, ThreadMessage, StartThreadPayload } from '../models/mailbox.models';

/**
 * Mesajlaşma kutusu çekirdeğinin backend ile haberleşmesini sağlayan soyut arayüz kontratı.
 * 
 * Entegrasyon yapan LLM veya geliştirici, kendi projesinin API servisini bu sınıfı extend
 * ederek bağlayabilir (`class MyApiAdapter extends MailStorageAdapter { ... }`).
 * 
 * @example
 * // Host projenin AppModule veya main.ts dosyasında:
 * providers: [
 *   { provide: MailStorageAdapter, useClass: MyBackendStorageAdapter }
 * ]
 */
export abstract class MailStorageAdapter {
  /**
   * Ağ bağlantı durumu akışı ('connected', 'reconnecting', 'disconnected').
   * Başlık alanındaki durum göstergesini besler.
   */
  abstract connectionStatus$: Observable<ConnectionStatus>;

  /**
   * Belirtilen kullanıcının tüm aktif mesajlaşmalarını sunucudan çeker.
   * @param userId Oturum açmış kullanıcının kimliği
   */
  abstract getThreads(userId: string | number): Observable<MailThread[]>;

  /**
   * Yeni bir mesajlaşma (thread) başlatır ve oluşturulan ilk konuyu döner.
   * @param payload Alıcı, konu başlığı ve ilk düz yazı mesaj
   */
  abstract startThread(payload: StartThreadPayload): Observable<MailThread>;

  /**
   * Var olan bir yazışmaya yeni bir düz metin mesajı iletir.
   * @param threadId İlgili mesajlaşmanın kimliği
   * @param body Mesaj metni (plain-text)
   */
  abstract sendMessage(threadId: string, body: string): Observable<ThreadMessage>;

  /**
   * Bir mesajlaşmayı okundu olarak işaretler.
   * @param threadId Okundu yapılan mesajlaşma kimliği
   */
  abstract markAsRead(threadId: string): Observable<void>;

  /**
   * WebSocket, SSE veya Push üzerinden gelen anlık mesaj akışını dinler.
   */
  abstract listenIncomingMessages(): Observable<{ threadId: string; message: ThreadMessage }>;
}
