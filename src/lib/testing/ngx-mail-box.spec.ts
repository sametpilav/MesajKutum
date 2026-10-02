import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, defer, Observable } from 'rxjs';
import { NgxMailBoxComponent } from '../components/mailbox-box/ngx-mail-box.component';
import { MailboxThreadDetailComponent } from '../components/thread-detail/thread-detail.component';
import { MailStorageAdapter } from '../adapters/mail-storage.adapter';
import { MockMailStorageAdapter } from '../adapters/mock-mail-storage.adapter';
import { MailNotificationService } from '../services/mail-notification.service';
import { MailQueueService } from '../services/mail-queue.service';
import { MailLoggerService } from '../services/mail-logger.service';
import { MailThread, MailUser } from '../models/mailbox.models';
import { backoffRetry } from '../utils/rx-backoff.operator';

/**
 * ============================================================================
 * LLM VE GELİŞTİRİCİ DOĞRULAMA TESTLERİ (SPEC)
 * ============================================================================
 * 
 * Bu test dosyası projenin temel prensiplerini doğrulamak üzere hazırlanmıştır:
 * 1. Enter tuşunun mesaj GÖNDERMEDİĞİ, yalnızca "Gönder" butonunun gönderdiği.
 * 2. Yeni mesajlaşma başlatma akışı.
 * 3. Canlı mesaj bildirimleri ve rozet sayacı artışı.
 * 4. Ağ hatası durumunda mesajın hafıza kuyruğuna (offline queue) alınması.
 * 5. Exponential backoff retry operatörünün gecikme kurgusu.
 */
describe('NgxMailBox Component & Architecture Tests', () => {
  const mockCurrentUser: MailUser = {
    id: 'usr-current',
    name: 'Test Kullanıcısı',
    email: 'test@example.com'
  };

  const mockUsers: MailUser[] = [
    { id: 'usr-1', name: 'Zeynep Kaya', email: 'zeynep@example.com' },
    { id: 'usr-2', name: 'Emre Demir', email: 'emre@example.com' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMailBoxComponent, MailboxThreadDetailComponent],
      providers: [
        { provide: MailStorageAdapter, useClass: MockMailStorageAdapter },
        MailNotificationService,
        MailQueueService,
        MailLoggerService
      ]
    }).compileComponents();
  });

  it('1. Enter veya Ctrl+Enter tuşuna basıldığında mesaj gönderilmemelidir; sadece açıkça Gönder butonuna tıklandığında iletilmelidir', () => {
    const fixture = TestBed.createComponent(MailboxThreadDetailComponent);
    const component = fixture.componentInstance;

    component.currentUser = mockCurrentUser;
    component.thread = {
      id: 'thr-1',
      subject: 'Test Konu',
      participants: [mockUsers[0]],
      messages: [],
      lastUpdated: new Date().toISOString(),
      isRead: true
    };
    component.replyText = 'Bu bir deneme metnidir.';
    fixture.detectChanges();

    let sendEmitted = false;
    component.sendMessage.subscribe(() => {
      sendEmitted = true;
    });

    // 1. Enter tuşuna basılması simülasyonu
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    component.onTextareaKeyDown(enterEvent);
    expect(sendEmitted).toBeFalse(); // Gönderilmemeli!

    // 2. Ctrl+Enter kısayolu simülasyonu
    const ctrlEnterEvent = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, cancelable: true });
    component.onTextareaKeyDown(ctrlEnterEvent);
    expect(sendEmitted).toBeFalse(); // Kısayol engellenmeli!

    // 3. Açıkça 'Gönder' butonuna tıklama simülasyonu
    component.onSendClick();
    expect(sendEmitted).toBeTrue(); // Sadece butona basıldığında fırlatılmalı!
  });

  it('2. Yeni mesajlaşma başlatıldığında adapter.startThread çağrılmalı ve yeni thread en başa eklenmelidir', fakeAsync(() => {
    const fixture = TestBed.createComponent(NgxMailBoxComponent);
    const component = fixture.componentInstance;
    component.currentUser = mockCurrentUser;
    component.users = mockUsers;
    fixture.detectChanges();
    tick(300); // İlk yükleme

    const initialCount = component.threads.length;

    component.onStartThread({
      recipient: mockUsers[0],
      subject: 'Yeni Konu Başlığı',
      firstMessage: 'Merhaba ilk mesaj metni'
    });
    tick(350);

    expect(component.threads.length).toBe(initialCount + 1);
    expect(component.threads[0].subject).toBe('Yeni Konu Başlığı');
    expect(component.selectedThread?.subject).toBe('Yeni Konu Başlığı');
  }));

  it('3. Canlı yeni mesaj geldiğinde okunmamış sayaç rozeti artmalıdır', () => {
    const notificationService = TestBed.inject(MailNotificationService);

    const initialUnread = notificationService.currentUnreadCount;
    expect(initialUnread).toBe(0);

    const sampleThreads: MailThread[] = [
      {
        id: 't-1',
        subject: 'Konu 1',
        participants: [mockUsers[0]],
        messages: [],
        lastUpdated: new Date().toISOString(),
        isRead: false
      },
      {
        id: 't-2',
        subject: 'Konu 2',
        participants: [mockUsers[1]],
        messages: [],
        lastUpdated: new Date().toISOString(),
        isRead: true
      }
    ];

    notificationService.updateUnreadCount(sampleThreads);
    expect(notificationService.currentUnreadCount).toBe(1);
  });

  it('4. Ağ bağlantısı koptuğunda basılan Gönder butonu mesajı hafıza kuyruğuna (pending) almalıdır', () => {
    const fixture = TestBed.createComponent(NgxMailBoxComponent);
    const component = fixture.componentInstance;
    const queueService = TestBed.inject(MailQueueService);

    component.currentUser = mockCurrentUser;
    component.connectionStatus = 'reconnecting'; // Ağ kopuk
    component.threads = [
      {
        id: 'thr-offline',
        subject: 'Çevrimdışı Test',
        participants: [mockUsers[0]],
        messages: [],
        lastUpdated: new Date().toISOString(),
        isRead: true
      }
    ];

    component.onSendMessage({
      threadId: 'thr-offline',
      body: 'Ağ kopukken yazılan mesaj'
    });

    const pending = queueService.getPendingForThread('thr-offline');
    expect(pending.length).toBe(1);
    expect(pending[0].body).toBe('Ağ kopukken yazılan mesaj');
    expect(pending[0].status).toBe('pending');
  });

  it('5. Exponential backoff retry operatörü hatalarda katlanarak artan aralıklarla yeniden denemelidir', fakeAsync(() => {
    let attempts = 0;
    const retryDelays: number[] = [];

    const faultyStream$: Observable<string> = defer(() => {
      attempts++;
      if (attempts < 3) {
        return throwError(() => new Error('Simüle edilmiş ağ kesintisi'));
      }
      return of('Başarılı Veri');
    }).pipe(
      backoffRetry({ maxRetries: 3, initialDelayMs: 1000 }, (attempt, delayMs) => {
        retryDelays.push(delayMs);
      })
    );

    let result = '';
    faultyStream$.subscribe(res => {
      result = res;
    });

    tick(1000); // 1. deneme gecikmesi (1000ms)
    tick(2000); // 2. deneme gecikmesi (2000ms)

    expect(result).toBe('Başarılı Veri');
    expect(retryDelays).toEqual([1000, 2000]);
  }));
});
