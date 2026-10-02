# ngx-mail-box

Angular tabanlı, Gmail benzeri yazışma zinciri (thread) mimarisine sahip, düz metin tabanlı, tema ve anlık bildirim destekli profesyonel mesajlaşma kutusu kütüphanesi.

## 🌟 Temel Özellikler

- 📬 **Gmail Tarzı Mesajlaşmalar:** WhatsApp gibi balonlu sohbet yerine konu başlıklı, kronolojik düz metin blokları ve katılımcı yapısı.
- 🚫 **Düz Yazı Tabanlı (Plain-Text Only):** Biçimlendirme araçları, resim veya dosya eki barındırmaz. Sıfır XSS riski, yüksek hız.
- 🔘 **Açıkça 'Gönder' Butonu Zorunluluğu:** Enter ve Shift+Enter daima yeni satıra geçer (`\n`). Kısayolla kazara mesaj gönderimi kesinlikle engellenmiştir.
- 📦 **Hazır Docked Popup (`<ngx-mail-docked-popup>`):** Host projenin hiçbir modal veya CSS kodu yazmasına gerek kalmadan sağ altta yüzer, tıklandığında açılır.
- 📱 **Container Queries Uyumlu (`<ngx-mail-box>`):** 650px'den küçük alanlarda veya modal içinde otomatik tek sütun (Geri butonlu Master-Detail); geniş ekranda çift panel.
- 🎨 **Dışarıdan Tema Desteği:** CSS Custom Properties (`--mb-primary`, vb.) ve TypeScript `MailThemeConfig` ile tam uyum.
- ⚡ **Ağ Dayanıklılığı (Exponential Backoff):** Geçici kesintilerde katlanarak artan aralıklarla (1s, 2s, 4s...) otomatik yeniden deneme.
- 💾 **Hafıza Kuyruğu (In-Memory Offline Queue) & Taslak Koruması:** Ağ kopukken yazılan mesajlar kaybolmaz, popup simge durumuna küçültülse dahi metin saklanır.
- 🤖 **LLM-Dostu:** Tam TSDoc açıklamaları, katı tipler ve [INTEGRATION.md](./INTEGRATION.md) ile bir Yapısal Yapay Zeka Ajanının tek seferde projeye bağlayabileceği mimari.

## 📁 Proje Yapısı

```
ngx-mail-box/
├── src/
│   ├── lib/
│   │   ├── adapters/          # Abstract kontrat & hazır REST/WebSocket mock şablonu
│   │   ├── components/        # Docked-popup, çekirdek box, badge, list, detail, new-thread
│   │   ├── models/            # Katı TSDoc tipleri (MailUser, MailThread, MailThemeConfig)
│   │   ├── services/          # Logger (debugMode), Queue, Notification servisleri
│   │   ├── utils/             # RxJS exponential backoff operatörü
│   │   └── testing/           # Birim ve entegrasyon testleri (spec)
│   └── public-api.ts          # Tek noktadan export
├── INTEGRATION.md             # LLM için 3 adımlı kılavuz
└── README.md
```

## 🚀 Hızlı Kullanım

Entegrasyonu gerçekleştirmek için lütfen [INTEGRATION.md](./INTEGRATION.md) dosyasını inceleyin.
