import { Observable } from 'rxjs';

/**
 * Mesajlaşma sistemindeki bir kullanıcıyı temsil eder.
 * Host uygulamanın kullanıcı veritabanı veya auth servisinden bu formatta veri sağlanmalıdır.
 * 
 * @example
 * const user: MailUser = {
 *   id: 'usr-101',
 *   name: 'Ahmet Yılmaz',
 *   email: 'ahmet@example.com',
 *   avatarText: 'AY'
 * };
 */
export interface MailUser {
  /** Kullanıcının benzersiz kimlik bilgisi (string veya number) */
  id: string | number;
  /** Arayüzde ve arama alanında görünecek ad soyad veya kullanıcı adı */
  name: string;
  /** İsteğe bağlı e-posta adresi */
  email?: string;
  /** Profil fotoğrafı yerine yuvarlak ikon içinde gösterilecek 2 harfli kısaltma (ör. 'AY') */
  avatarText?: string;
  /** İsteğe bağlı unvan veya departman bilgisi */
  role?: string;
}

/**
 * Bir mesajlaşma zinciri (thread) içerisindeki tekil bir mesajı temsil eder.
 * Sadece düz metin (plain text) içerir, biçimlendirme ve resim/dosya barındırmaz.
 */
export interface ThreadMessage {
  /** Mesajın benzersiz kimliği */
  id: string;
  /** Bağlı olduğu yazışmanın kimliği */
  threadId: string;
  /** Mesajı yazan kullanıcı */
  sender: MailUser;
  /** 
   * Mesajın düz metin içeriği. 
   * XSS risklerini önlemek için salt metindir. Boşluklar ve satır atlamaları korunur.
   */
  body: string;
  /** Mesajın gönderim tarihi / zaman damgası */
  sentAt: Date | string;
  /** 
   * Mesajın gönderim durumu.
   * - 'sent': Sunucuya başarıyla iletildi
   * - 'pending': Bağlantı kesintisi nedeniyle offline kuyrukta bekliyor
   * - 'failed': Kalıcı hata aldı
   */
  status?: 'sent' | 'pending' | 'failed';
}

/**
 * Gmail tarzı bir yazışma zincirini (thread) temsil eder.
 * Tek bir konu başlığı altında toplanmış tüm mesajları içerir.
 */
export interface MailThread {
  /** Yazışmanın benzersiz kimliği */
  id: string;
  /** Mesajlaşmanın konu başlığı */
  subject: string;
  /** Bu yazışmaya dahil olan tüm kullanıcılar */
  participants: MailUser[];
  /** Bu yazışmaya ait tüm mesajlar (kronolojik sırada: eskiden yeniye) */
  messages: ThreadMessage[];
  /** Son mesajın gönderilme zamanı (listenin sıralanmasında kullanılır) */
  lastUpdated: Date | string;
  /** Aktif kullanıcı için okunmamış yeni mesaj var mı? */
  isRead: boolean;
}

/**
 * Yeni bir mesajlaşma başlatma isteği veri yapısı.
 */
export interface StartThreadPayload {
  /** Alıcı kullanıcı bilgisi */
  recipient: MailUser;
  /** Mesajlaşma konusu */
  subject: string;
  /** İlk mesajın düz metin içeriği */
  firstMessage: string;
}

/**
 * Mesajlaşma kutusu görünüm ve yerleşim modu.
 * - 'auto': Kapsayıcının genişliğine göre otomatik karar verir (Container Queries)
 * - 'compact': Her zaman tek sütun (mobil / küçük popup uyumlu, geri butonlu)
 * - 'split': Her zaman yan yana iki sütun (geniş ekran / çift panel)
 */
export type MailboxLayoutMode = 'auto' | 'compact' | 'split';

/**
 * Ağ bağlantı durumunu temsil eden tip.
 */
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

/**
 * Ağ hatası durumunda otomatik yeniden deneme (exponential backoff) konfigürasyonu.
 */
export interface RetryConfig {
  /** Maksimum yeniden deneme sayısı (varsayılan: 4) */
  maxRetries?: number;
  /** İlk deneme gecikmesi milisaniye (varsayılan: 1000) */
  initialDelayMs?: number;
  /** Ulaşılabilecek maksimum bekleme süresi milisaniye (varsayılan: 16000) */
  maxDelayMs?: number;
}

/**
 * Mesajlaşma kutusu tema yapılandırma nesnesi.
 * Dışarıdan özel marka renkleri enjekte etmek için kullanılır.
 */
export interface MailThemeConfig {
  /** Genel tema modu */
  mode?: 'light' | 'dark';
  /** Marka ana rengi (varsayılan: Gmail mavisi #1a73e8) */
  primaryColor?: string;
  /** Birincil renk hover tonu */
  primaryHoverColor?: string;
  /** Panel ve kart arka plan rengi */
  surfaceColor?: string;
  /** Ana sayfa/kutu arka plan rengi */
  backgroundColor?: string;
  /** Ana metin rengi */
  textColor?: string;
  /** İkincil soluk metin rengi */
  textMutedColor?: string;
  /** Kenarlık ve ayırıcı çizgi rengi */
  borderColor?: string;
  /** Okunmamış öğe satır vurgu rengi */
  unreadBgColor?: string;
  /** Satır hover arka plan rengi */
  hoverBgColor?: string;
}
