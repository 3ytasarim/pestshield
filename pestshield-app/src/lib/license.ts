import type { LicenseType } from "@/generated/prisma/enums";

export interface LicensePreset {
  type: LicenseType;
  label: string;
  durationDays: number;
}

export const LICENSE_PRESETS: LicensePreset[] = [
  { type: "DEMO", label: "5 Günlük Deneme", durationDays: 5 },
  { type: "MONTHLY", label: "Aylık", durationDays: 30 },
  { type: "YEARLY", label: "Yıllık", durationDays: 365 },
];

/** Kalan gün sayısı — süresi dolmuşsa veya lisans yoksa null döner. */
export function computeDaysRemaining(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export type LicenseStatus = "NONE" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export function computeLicenseStatus(expiresAt: Date | null): LicenseStatus {
  const days = computeDaysRemaining(expiresAt);
  if (days === null) return "NONE";
  if (days <= 0) return "EXPIRED";
  if (days <= 7) return "EXPIRING_SOON";
  return "ACTIVE";
}
