# 🤖 LLM Entegrasyon Kılavuzu (`ngx-mail-box`)

Bu belge, bu mesajlaşma kutusu kütüphanesini hedef bir Angular projesine entegre edecek **LLM'ler (Yapay Zeka Kodlama Ajanları)** için hazırlanmış, sıfır hatayla doğrudan uygulanabilir 3 adımlı entegrasyon rehberidir.

---

## ⚡ Hızlı Özet (Mimari Kurallar)
- **Sadece Düz Metin**: HTML biçimlendirme ve resim/dosya eki yoktur.
- **Kesin Gönderim Kuralı**: Enter ve Shift+Enter tuşları sadece yeni satıra geçer (`\n`). Ctrl+Enter kısayolu engellenmiştir. Mesaj yalnızca açıkça **"Gönder"** butonuna basıldığında iletilir.
- **Kutulu Yapı**: Silme veya çöp kutusu yoktur. Yalnızca mesajlaşmalar listesi, mevcut yazışmayı sürdürme ve yeni mesajlaşma başlatma vardır.
- **Sağ Altta Hazır Popup**: `<ngx-mail-docked-popup>` bileşeni hiçbir modal kodu yazmaya gerek kalmadan sağ altta yüzer ve tıklandığında açılır.

---

## 📋 3 Adımda Kolay Entegrasyon

### Adım 1: Host Bileşene Import Edin
Hedef projedeki standalone bileşeninize (örneğin `app.component.ts` veya `dashboard.component.ts`):

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// 1. Kütüphaneden gerekli bileşen ve modelleri import edin:
import { 
  NgxMailDockedPopupComponent, 
  MailUser, 
  MailThemeConfig 
} from './projects/ngx-mail-box/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxMailDockedPopupComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  // 2. Aktif oturum açmış kullanıcı (Zorunludur)
  currentUser: MailUser = {
    id: 'usr-current',
    name: 'Sistem Yöneticisi',
    email: 'admin@sirket.com',
    avatarText: 'SY'
  };

  // 3. Yeni mesaj başlatılırken seçilebilecek kullanıcılar listesi
  userList: MailUser[] = [
    { id: 'usr-1', name: 'Zeynep Kaya', email: 'zeynep@sirket.com', avatarText: 'ZK' },
    { id: 'usr-2', name: 'Emre Demir', email: 'emre@sirket.com', avatarText: 'ED' },
    { id: 'usr-3', name: 'Ayşe Çelik', email: 'ayse@sirket.com', avatarText: 'AÇ' }
  ];

  // 4. (Opsiyonel) Olay yakalama
  onMessageSent(event: { threadId: string; body: string }): void {
    console.log('Mesaj başarıyla iletildi:', event);
  }
}
```

---

### Adım 2: Şablona (HTML) Ekleyin
Host bileşenin `app.component.html` dosyasının en altına şu satırı eklemeniz yeterlidir:

```html
<!-- Sıfır konfigürasyonlu sağ alt açılır mesajlaşma kutusu -->
<ngx-mail-docked-popup
  [currentUser]="currentUser"
  [users]="userList"
  [debugMode]="true"
  (messageSent)="onMessageSent($event)">
</ngx-mail-docked-popup>
```

> **İpucu:** Eğer sağ alttaki popup yerine sayfa içinde gömülü veya kendi modalınız içinde kullanmak isterseniz:
> ```html
> <div style="width: 500px; height: 600px;">
>   <ngx-mail-box
>     [currentUser]="currentUser"
>     [users]="userList"
>     [showCloseButton]="true"
>     (close)="modalKapat()">
>   </ngx-mail-box>
> </div>
> ```

---

### Adım 3 (Opsiyonel): Gerçek Backend API'ye Bağlama

Varsayılan olarak kütüphane hiçbir backend gerektirmeden çalışan `MockMailStorageAdapter` ile gelir.

Gerçek bir backend'e bağlamak için:
1. `MailStorageAdapter` soyut sınıfını extend eden bir servis yazın:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  MailStorageAdapter, 
  MailThread, 
  ThreadMessage, 
  StartThreadPayload, 
  ConnectionStatus,
  backoffRetry 
} from './projects/ngx-mail-box/src/public-api';

@Injectable({ providedIn: 'root' })
export class MyHttpMailStorageAdapter extends MailStorageAdapter {
  connectionStatus$ = ...; // Ağ durumu akışı

  constructor(private http: HttpClient) { super(); }

  getThreads(userId: string | number): Observable<MailThread[]> {
    return this.http.get<MailThread[]>(`/api/mail/threads?userId=${userId}`).pipe(
      backoffRetry({ maxRetries: 3 })
    );
  }

  startThread(payload: StartThreadPayload): Observable<MailThread> {
    return this.http.post<MailThread>('/api/mail/threads', payload);
  }

  sendMessage(threadId: string, body: string): Observable<ThreadMessage> {
    return this.http.post<ThreadMessage>(`/api/mail/threads/${threadId}/messages`, { body });
  }

  markAsRead(threadId: string): Observable<void> {
    return this.http.put<void>(`/api/mail/threads/${threadId}/read`, {});
  }

  listenIncomingMessages(): Observable<{ threadId: string; message: ThreadMessage }> {
    // WebSocket / SignalR stream'ini bağlayın
    return this.myWebSocketService.onMessage$;
  }
}
```

2. Host uygulamanın `app.config.ts` veya `main.ts` dosyasına provider olarak ekleyin:
```typescript
providers: [
  { provide: MailStorageAdapter, useClass: MyHttpMailStorageAdapter }
]
```

---

## 🛠️ Input & Output Referans Tablosu

### `<ngx-mail-docked-popup>` Parametreleri:
| Özellik | Tip | Zorunlu? | Varsayılan | Açıklama |
| :--- | :--- | :--- | :--- | :--- |
| `currentUser` | `MailUser` | **Evet** | - | Aktif oturum açmış kullanıcı (gönderen) |
| `users` | `MailUser[]` | Hayır | `[]` | Yeni mesaj başlatırken seçilebilecek kullanıcılar |
| `title` | `string` | Hayır | `'Mesajlaşmalarım'` | Başlık çubuğundaki metin |
| `theme` | `'light' \| 'dark' \| MailThemeConfig` | Hayır | `'light'` | Tema modu veya renk tokenları |
| `debugMode` | `boolean` | Hayır | `false` | Konsola ayrıntılı etiketli log basar |
| `defaultOpen` | `boolean` | Hayır | `false` | Sayfa açıldığında popup açık başlasın mı |
| `(messageSent)` | `EventEmitter` | - | - | Sadece "Gönder" butonuna basıldığında fırlatılır |
| `(threadStarted)` | `EventEmitter` | - | - | Yeni bir yazışma başlatıldığında fırlatılır |

---

## 🔍 Sık Karşılaşılan Sorunlar ve Çözümleri (Troubleshooting)

1. **Enter'a basınca mesaj gitmiyor, satır atlıyor:**
   - *Çözüm:* Bu bir hata değildir; şartname gereğidir. Mesajı iletmek için açıkça **"Gönder"** butonuna basılmalıdır.
2. **Kullanıcı listesi görünmüyor:**
   - *Çözüm:* `currentUser.id` ile aynı ID'ye sahip kullanıcılar alıcı listesinden otomatik filtrelenir (kendine mesaj atmayı önlemek için). `users` dizisinde en az bir farklı kullanıcı ID'si olduğundan emin olun.
3. **Popup açılmıyor veya stiller bozuk görünüyor:**
   - *Çözüm:* `debugMode=true` vererek tarayıcı konsolundaki `[NgxMailBox:INIT]` loglarını inceleyin.
