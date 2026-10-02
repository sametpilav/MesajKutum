# 📬 MesajKutum (`ngx-mail-box`)

[![Angular](https://img.shields.io/badge/Angular-19.x-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

Herhangi bir Angular projesine kolayca dahil edilebilen, **Gmail tarzı yazışma zinciri (thread)** mimarisine sahip, **düz metin tabanlı**, **tema ve anlık bildirim destekli** profesyonel mesajlaşma kutusu kütüphanesi.

---

## 🚀 Öne Çıkan Özellikler

- ✉️ **Gmail Tarzı Konu ve Zincir (Thread):** WhatsApp gibi balonlu sohbet yerine konu başlıklı, katılımcılı, kronolojik mesaj geçmişi.
- 📝 **Sadece Düz Metin (Plain-Text Only):** Biçimlendirme araçları, resim veya dosya eki içermez. Yüksek güvenlik (sıfır XSS riski) ve maksimum hafiflik.
- 🛑 **Açıkça 'Gönder' Butonu Kuralı:** `Enter` ve `Shift+Enter` her zaman yeni satıra geçer (`\n`). Kısayolla kazara mesaj iletimi engellenmiştir; gönderim için belirgin "Gönder" butonuna tıklanmalıdır.
- 🪟 **Hazır Docked Popup (`<ngx-mail-docked-popup>`):** Host projenin hiçbir modal veya CSS kodu yazmasına gerek kalmadan sağ altta yüzen bildirim butonu ve açılır pencere.
- 📐 **Adaptif Yerleşim (Container Queries):** 650px'den dar alanlarda veya modal pencerelerinde otomatik tek sütun (Geri butonlu Master-Detail); geniş ekranda çift panel.
- 🎨 **Dışarıdan Tema Enjeksiyonu:** CSS değişkenleri (`--mb-primary`, vb.) ve TypeScript `MailThemeConfig` ile koyu/açık mod uyumu.
- ⚡ **Ağ Dayanıklılığı (Exponential Backoff):** Ağ kopmalarında 1s, 2s, 4s... katlanarak artan aralıklarla otomatik yeniden deneme.
- 💾 **Hafıza Kuyruğu & Taslak Koruması:** Bağlantı kesildiğinde basılan "Gönder" butonunun içeriği kaybolmaz, popup simge durumuna küçültülse dahi yazılan taslak metin korunur.
- 🤖 **LLM-Dostu Mimari:** Bir Yapay Zeka Ajanının (LLM/Copilot) hedef projeye sıfır hatayla bağlayabilmesi için eksiksiz TSDoc açıklamaları ve [INTEGRATION.md](./INTEGRATION.md) rehberi.

---

## 📁 Düz (Flat) Proje Dizin Yapısı

Bu depo doğrudan tekil kütüphane standardındadır:

```
MesajKutum/
├── src/                          # Kütüphane Kaynak Kodları
│   ├── lib/
│   │   ├── adapters/             # Soyut kontrat & hazır REST/WebSocket mock şablonu
│   │   ├── components/           # Docked-popup, çekirdek box, badge, list, detail, new-thread
│   │   ├── models/               # Katı TSDoc tipleri (MailUser, MailThread, MailThemeConfig)
│   │   ├── services/             # Logger (debugMode), Queue, Notification servisleri
│   │   ├── utils/                # RxJS exponential backoff operatörü
│   │   └── testing/              # Birim ve entegrasyon testleri (spec)
│   └── public-api.ts             # Tek noktadan export
├── ng-package.json               # ng-packagr paketleme yapılandırması
├── tsconfig.lib.json             # Kütüphane derleme TypeScript yapılandırması
├── tsconfig.json                 # Kök TypeScript yapılandırması
├── package.json                  # Paket bilgisi, bağımlılıklar ve derleme komutları
├── INTEGRATION.md                # LLM için 3 adımlı entegrasyon kılavuzu
├── .gitignore                    # Git hariç tutma kuralları
├── LICENSE                       # MIT Lisansı
└── README.md                     # GitHub ana dokümantasyonu
```

---

## ⚡ Hızlı Kullanım (Quick Start)

### 1. Bileşeni Import Edin
Hedef Angular projenizin standalone bileşenine ekleyin:

```typescript
import { Component } from '@angular/core';
import { NgxMailDockedPopupComponent, MailUser } from 'ngx-mail-box';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxMailDockedPopupComponent],
  template: `
    <ngx-mail-docked-popup
      [currentUser]="currentUser"
      [users]="userList"
      [debugMode]="true"
      (messageSent)="onMessageSent($event)">
    </ngx-mail-docked-popup>
  `
})
export class AppComponent {
  currentUser: MailUser = { id: 'usr-1', name: 'Ahmet Yılmaz', avatarText: 'AY' };
  userList: MailUser[] = [
    { id: 'usr-2', name: 'Zeynep Kaya', avatarText: 'ZK' },
    { id: 'usr-3', name: 'Emre Demir', avatarText: 'ED' }
  ];

  onMessageSent(e: { threadId: string; body: string }) {
    console.log('Mesaj iletildi:', e);
  }
}
```

> 🤖 **LLM ile Entegrasyon Yapacaklar İçin:**
> Ayrıntılı REST/WebSocket backend adaptörü bağlantısı ve 3 adımlı kılavuz için [INTEGRATION.md](./INTEGRATION.md) dosyasını inceleyin.

---

## 🔨 Geliştirme ve Derleme (Build)

```bash
# Bağımlılıkları yükleyin
npm install

# Kütüphaneyi derleyin (dist/ klasörüne üretir)
npm run build

# Canlı izleme modu (Development watch)
npm run watch

# Testleri çalıştırın
npm test
```

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
