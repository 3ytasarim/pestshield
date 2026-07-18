// PestShield AI Command Center — Faz 4 izin sabitleri.
//
// src/lib/ai/actions/permissions.ts ile AYNI desen (ACTION_PERMISSION +
// checkActionPermission), Faz 4'ün ses/bildirim/uyarı/WhatsApp/brifing/
// eskalasyon aksiyonları için genişletilmiştir. Sunucu tarafında
// (/api/whatsapp/*, /api/voice/*) auth() ile birlikte kullanılmalıdır.

export type AppRole = "ADMIN" | "TECH" | "CLIENT";

export type Phase4Permission =
  | "voice.use"
  | "voice.action_propose"
  | "voice.action_confirm"
  | "notification.view"
  | "notification.manage"
  | "notification.settings.update"
  | "alert.acknowledge"
  | "alert.dismiss"
  | "alert.snooze"
  | "alert.rules.manage"
  | "whatsapp.draft"
  | "whatsapp.send"
  | "whatsapp.templates.manage"
  | "briefing.manage"
  | "escalation.manage";

const ALLOWED_ROLES: Record<Phase4Permission, AppRole[]> = {
  "voice.use": ["ADMIN", "TECH", "CLIENT"],
  "voice.action_propose": ["ADMIN", "CLIENT"],
  "voice.action_confirm": ["ADMIN", "CLIENT"],
  "notification.view": ["ADMIN", "TECH", "CLIENT"],
  "notification.manage": ["ADMIN", "TECH", "CLIENT"],
  "notification.settings.update": ["ADMIN", "TECH", "CLIENT"],
  "alert.acknowledge": ["ADMIN", "TECH", "CLIENT"],
  "alert.dismiss": ["ADMIN", "TECH", "CLIENT"],
  "alert.snooze": ["ADMIN", "TECH", "CLIENT"],
  "alert.rules.manage": ["ADMIN"],
  "whatsapp.draft": ["ADMIN", "CLIENT"],
  "whatsapp.send": ["ADMIN", "CLIENT"],
  "whatsapp.templates.manage": ["ADMIN"],
  "briefing.manage": ["ADMIN", "CLIENT"],
  "escalation.manage": ["ADMIN"],
};

const DENIAL_MESSAGE = "Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.";

export function checkPhase4Permission(permission: Phase4Permission, role: string): { allowed: boolean; requiredPermission: string; reason?: string } {
  const allowed = ALLOWED_ROLES[permission].includes(role as AppRole);
  return { allowed, requiredPermission: permission, reason: allowed ? undefined : DENIAL_MESSAGE };
}
