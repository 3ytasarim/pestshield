export enum LicenseType {
  DEMO = 'demo',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * issued  -> anahtar üretildi, henüz aktive edilmedi
 * active  -> müşteri anahtarı aktive etti, expiresAt'e kadar geçerli
 * expired -> expiresAt geçti (sorgu anında hesaplanır, ayrıca guard tarafından işaretlenir)
 * revoked -> admin tarafından iptal edildi
 */
export enum LicenseStatus {
  ISSUED = 'issued',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export const LICENSE_DURATION_DAYS: Record<LicenseType, number> = {
  [LicenseType.DEMO]: 5,
  [LicenseType.MONTHLY]: 30,
  [LicenseType.YEARLY]: 365,
};
