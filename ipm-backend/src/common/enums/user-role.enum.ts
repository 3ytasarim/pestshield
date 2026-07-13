/**
 * admin  -> Pak İş (ilaçlama firması) personeli/yöneticisi, tüm veriyi görür
 * tech   -> Saha personeli, cihaz kontrolü yapar (activity_logs oluşturur)
 * client -> Müşteri, sadece kendi cihazlarını ve kontrol geçmişini görür
 */
export enum UserRole {
  ADMIN = 'admin',
  TECH = 'tech',
  CLIENT = 'client',
}
