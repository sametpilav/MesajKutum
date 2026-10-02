import { Injectable } from '@angular/core';

/**
 * Mesajlaşma kutusunun iç işleyişini, network hareketlerini, kuyruk durumlarını
 * ve event akışlarını konsola yapılandırılmış biçimde basan loglama servisi.
 * 
 * Entegrasyon yapan LLM veya geliştiriciler debugMode=true vererek konsoldan
 * tüm adımları canlı takip edebilir.
 */
@Injectable({
  providedIn: 'root'
})
export class MailLoggerService {
  private enabled = false;

  /**
   * Loglamayı etkinleştirir veya devre dışı bırakır.
   */
  setDebugMode(isEnabled: boolean): void {
    this.enabled = isEnabled;
    if (isEnabled) {
      console.log(
        '%c[NgxMailBox]%c Debug modu aktif edildi. Tüm olaylar konsola kaydedilecek.',
        'background: #1a73e8; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
        'color: inherit;'
      );
    }
  }

  /**
   * Başlatma ve konfigürasyon logu
   */
  init(message: string, context?: any): void {
    if (!this.enabled) return;
    this.log('INIT', '#1a73e8', message, context);
  }

  /**
   * Ağ ve API istek logları
   */
  network(message: string, context?: any): void {
    if (!this.enabled) return;
    this.log('NETWORK', '#8e24aa', message, context);
  }

  /**
   * Yeniden deneme (retry/backoff) logları
   */
  retry(message: string, context?: any): void {
    if (!this.enabled) return;
    this.log('RETRY', '#f57c00', message, context);
  }

  /**
   * Offline kuyruk logları
   */
  queue(message: string, context?: any): void {
    if (!this.enabled) return;
    this.log('QUEUE', '#00897b', message, context);
  }

  /**
   * Event çıktıları (Output emits)
   */
  event(eventName: string, payload?: any): void {
    if (!this.enabled) return;
    this.log('EVENT', '#2e7d32', `Output fırlatıldı: (${eventName})`, payload);
  }

  /**
   * Hata logları
   */
  error(message: string, error?: any): void {
    if (!this.enabled) return;
    console.error(
      `%c[NgxMailBox:ERROR]%c ${message}`,
      'background: #d32f2f; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #d32f2f; font-weight: bold;',
      error || ''
    );
  }

  private log(tag: string, color: string, message: string, context?: any): void {
    const badgeStyle = `background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;`;
    if (context !== undefined) {
      console.log(`%c[NgxMailBox:${tag}]%c ${message}`, badgeStyle, 'color: inherit;', context);
    } else {
      console.log(`%c[NgxMailBox:${tag}]%c ${message}`, badgeStyle, 'color: inherit;');
    }
  }
}
