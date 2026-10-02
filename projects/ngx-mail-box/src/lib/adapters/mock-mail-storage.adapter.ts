import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, delay, tap } from 'rxjs';
import { MailStorageAdapter } from './mail-storage.adapter';
import { ConnectionStatus, MailThread, ThreadMessage, StartThreadPayload, MailUser } from '../models/mailbox.models';
import { MailLoggerService } from '../services/mail-logger.service';
import { backoffRetry } from '../utils/rx-backoff.operator';

/**
 * ============================================================================
 * LLM ENTEGRASYON ŞABLONU VE GELİŞTİRME/TEST MOCK ADAPTÖRÜ
 * ============================================================================
 * 
 * Bu sınıf, hiçbir backend olmadan mesajlaşma kutusunun anında çalışmasını sağlar.
 * 
 * 🤖 LLM YÖNERGESİ (Gerçek Backend Bağlantısı İçin):
 * 1. Bu sınıfı kopyalayıp `HttpMailStorageAdapter` adıyla yeni bir servis oluşturun.
 * 2. Constructor içerisine `HttpClient` enjekte edin (`private http: HttpClient`).
 * 3. Aşağıdaki `TODO (LLM)` işaretli metodları projenizin gerçek REST endpoint'leri
 *    ve WebSocket / SignalR bağlantısıyla değiştirin.
 * 4. `backoffRetry` operatörünü koruyun, bu operatör ağ hatalarında otomatik
 *    yeniden deneme güvencesi sunar.
 */
@Injectable({
  providedIn: 'root'
})
export class MockMailStorageAdapter extends MailStorageAdapter {
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('connected');
  readonly connectionStatus$: Observable<ConnectionStatus> = this.connectionStatusSubject.asObservable();

  private incomingSubject = new Subject<{ threadId: string; message: ThreadMessage }>();

  // Hafızadaki örnek mock veriler
  private mockThreads: MailThread[] = [
    {
      id: 'thr-101',
      subject: 'Proje Mimari Kararları ve Sprint Planı',
      participants: [
        { id: 'usr-2', name: 'Zeynep Kaya', email: 'zeynep@example.com', avatarText: 'ZK', role: 'Lead Architect' }
      ],
      isRead: false,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 dk önce
      messages: [
        {
          id: 'msg-1',
          threadId: 'thr-101',
          sender: { id: 'usr-2', name: 'Zeynep Kaya', email: 'zeynep@example.com', avatarText: 'ZK' },
          body: 'Merhaba,\n\nYeni mimaride mesajlaşma modülünü standalone component olarak kurguladık. Gmail tarzı bir yazışma akışı izleyeceğiz.\n\nGeri bildirimlerini bekliyorum.',
          sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: 'sent'
        },
        {
          id: 'msg-2',
          threadId: 'thr-101',
          sender: { id: 'usr-2', name: 'Zeynep Kaya', email: 'zeynep@example.com', avatarText: 'ZK' },
          body: 'Ek olarak: Düz metin (plain text) olması ve biçimlendirme araçlarının yer almaması kararı onaylandı.',
          sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'sent'
        }
      ]
    },
    {
      id: 'thr-102',
      subject: 'Tasarım Sistemi & Renk Paleti İncelemesi',
      participants: [
        { id: 'usr-3', name: 'Emre Demir', email: 'emre@example.com', avatarText: 'ED', role: 'UI/UX Designer' }
      ],
      isRead: true,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 saat önce
      messages: [
        {
          id: 'msg-3',
          threadId: 'thr-102',
          sender: { id: 'usr-3', name: 'Emre Demir', email: 'emre@example.com', avatarText: 'ED' },
          body: 'Selamlar,\n\nCSS Custom Properties üzerinden tema değerlerini dışarıdan alabilme yapısını test ettik. Koyu mod ve açık mod renkleri uyumlu görünüyor.',
          sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          status: 'sent'
        }
      ]
    }
  ];

  constructor(private logger: MailLoggerService) {
    super();
  }

  /**
   * TODO (LLM): Gerçek API için:
   * return this.http.get<MailThread[]>(`/api/mail/threads?userId=${userId}`).pipe(
   *   backoffRetry({ maxRetries: 3 })
   * );
   */
  getThreads(userId: string | number): Observable<MailThread[]> {
    this.logger.network(`getThreads çağrıldı (userId: ${userId})`);
    return of(JSON.parse(JSON.stringify(this.mockThreads))).pipe(
      delay(200),
      backoffRetry({ maxRetries: 3 }, (attempt, delayMs) => {
        this.setConnectionStatus('reconnecting');
        this.logger.retry(`getThreads yeniden deneniyor (Deneme: ${attempt}, Gecikme: ${delayMs}ms)`);
      }),
      tap(() => this.setConnectionStatus('connected'))
    );
  }

  /**
   * TODO (LLM): Gerçek API için:
   * return this.http.post<MailThread>('/api/mail/threads', payload).pipe(
   *   backoffRetry({ maxRetries: 3 })
   * );
   */
  startThread(payload: StartThreadPayload): Observable<MailThread> {
    this.logger.network('startThread çağrıldı', payload);
    const newThreadId = 'thr-' + Date.now();
    const newMsgId = 'msg-' + Date.now();

    const newThread: MailThread = {
      id: newThreadId,
      subject: payload.subject.trim(),
      participants: [payload.recipient],
      isRead: true,
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: newMsgId,
          threadId: newThreadId,
          sender: { id: 'current', name: 'Ben' },
          body: payload.firstMessage.trim(),
          sentAt: new Date().toISOString(),
          status: 'sent'
        }
      ]
    };

    this.mockThreads.unshift(newThread);
    return of(newThread).pipe(
      delay(300),
      tap(() => this.setConnectionStatus('connected'))
    );
  }

  /**
   * TODO (LLM): Gerçek API için:
   * return this.http.post<ThreadMessage>(`/api/mail/threads/${threadId}/messages`, { body }).pipe(
   *   backoffRetry({ maxRetries: 3 })
   * );
   */
  sendMessage(threadId: string, body: string): Observable<ThreadMessage> {
    this.logger.network(`sendMessage çağrıldı (threadId: ${threadId})`, { body });
    const targetThread = this.mockThreads.find(t => t.id === threadId);

    const newMessage: ThreadMessage = {
      id: 'msg-' + Date.now(),
      threadId,
      sender: { id: 'current', name: 'Ben' },
      body: body.trim(),
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    if (targetThread) {
      targetThread.messages.push(newMessage);
      targetThread.lastUpdated = newMessage.sentAt;
      // Listeyi güncellemek için en başa al
      const index = this.mockThreads.indexOf(targetThread);
      if (index > 0) {
        this.mockThreads.splice(index, 1);
        this.mockThreads.unshift(targetThread);
      }
    }

    return of(newMessage).pipe(
      delay(250),
      tap(() => this.setConnectionStatus('connected'))
    );
  }

  /**
   * TODO (LLM): Gerçek API için:
   * return this.http.put<void>(`/api/mail/threads/${threadId}/read`, {}).pipe(
   *   backoffRetry({ maxRetries: 3 })
   * );
   */
  markAsRead(threadId: string): Observable<void> {
    const thread = this.mockThreads.find(t => t.id === threadId);
    if (thread) {
      thread.isRead = true;
    }
    return of(void 0).pipe(delay(100));
  }

  /**
   * TODO (LLM): Gerçek WebSocket / SignalR için:
   * return this.socketService.fromEvent<{ threadId: string; message: ThreadMessage }>('new_message');
   */
  listenIncomingMessages(): Observable<{ threadId: string; message: ThreadMessage }> {
    return this.incomingSubject.asObservable();
  }

  /**
   * Test amacıyla simüle edilmiş canlı mesaj tetikleme yardımcısı
   */
  simulateIncomingMessage(threadId: string, sender: MailUser, body: string): void {
    const message: ThreadMessage = {
      id: 'msg-incoming-' + Date.now(),
      threadId,
      sender,
      body,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const thread = this.mockThreads.find(t => t.id === threadId);
    if (thread) {
      thread.messages.push(message);
      thread.lastUpdated = message.sentAt;
      thread.isRead = false;
      const index = this.mockThreads.indexOf(thread);
      if (index > 0) {
        this.mockThreads.splice(index, 1);
        this.mockThreads.unshift(thread);
      }
    }

    this.incomingSubject.next({ threadId, message });
    this.logger.network('Simüle edilmiş canlı mesaj yayınlandı', { threadId, message });
  }

  /**
   * Bağlantı durumunu manuel güncelleme (Test amaçlı)
   */
  setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatusSubject.next(status);
  }
}
