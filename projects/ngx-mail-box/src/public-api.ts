/**
 * ============================================================================
 * NGX-MAIL-BOX PUBLIC API
 * ============================================================================
 * 
 * Gmail tarzı, düz metin tabanlı, tema ve anlık bildirim destekli Angular
 * mesajlaşma kutusu kütüphanesi genel dışa aktarım dosyası.
 */

// 1. Modeller ve Tipler
export * from './lib/models/mailbox.models';

// 2. Servisler
export * from './lib/services/mail-logger.service';
export * from './lib/services/mail-queue.service';
export * from './lib/services/mail-notification.service';

// 3. Adaptörler
export * from './lib/adapters/mail-storage.adapter';
export * from './lib/adapters/mock-mail-storage.adapter';

// 4. Yardımcı RxJS Operatörleri
export * from './lib/utils/rx-backoff.operator';

// 5. Bileşenler
export * from './lib/components/mailbox-box/ngx-mail-box.component';
export * from './lib/components/docked-popup/ngx-mail-docked-popup.component';
export * from './lib/components/badge/ngx-mail-badge.component';
export * from './lib/components/thread-list/thread-list.component';
export * from './lib/components/thread-detail/thread-detail.component';
export * from './lib/components/new-thread/new-thread.component';
