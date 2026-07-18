// PestShield AI Command Center — Faz 3 izin haritası.
//
// GÜVENLİK SINIRLAMASI: Bu uygulamada gerçek bir backend/DB yetkilendirme
// katmanı yok — tek güvenilir kimlik kaynağı NextAuth oturumudur (session.user.role).
// Faz 1'deki TECH kısıtlaması (get_technician_schedule) ile AYNI güven
// seviyesinde: rol istemci tarafında da NextAuth session'dan okunur, sunucu
// tarafında da /api/ai/chat route'unda zaten doğrulanır. Faz 3 yazma
// aksiyonları için rol kontrolü BURADA (tek, merkezi yerde) yapılır —
// LLM'in kendisi asla bu kontrolü atlayamaz çünkü LLM hiçbir zaman
// executor'ları doğrudan çağıramaz (bkz. executors.ts).

import type { AiActionType } from "@/lib/ai/actions/types";

export type AppRole = "ADMIN" | "TECH" | "CLIENT";

export const ACTION_PERMISSION: Record<AiActionType, string> = {
  create_service: "service.create",
  reschedule_service: "service.reschedule",
  assign_technician: "service.assign",
  create_followup_task: "task.create",
  prepare_email: "email.prepare",
  send_email: "email.send",
  send_whatsapp_message: "whatsapp.send",
};

/** Faz 3 yazma aksiyonlarını kimlerin gerçekleştirebileceği. TECH rolü (saha teknisyeni) idari yazma işlemlerinden hariç tutulur. */
const ALLOWED_ROLES: Record<AiActionType, AppRole[]> = {
  create_service: ["ADMIN", "CLIENT"],
  reschedule_service: ["ADMIN", "CLIENT"],
  assign_technician: ["ADMIN", "CLIENT"],
  create_followup_task: ["ADMIN", "CLIENT"],
  prepare_email: ["ADMIN", "CLIENT"],
  send_email: ["ADMIN", "CLIENT"],
  send_whatsapp_message: ["ADMIN", "CLIENT"],
};

export function checkActionPermission(actionType: AiActionType, role: string): { allowed: boolean; requiredPermission: string; reason?: string } {
  const requiredPermission = ACTION_PERMISSION[actionType];
  const allowedRoles = ALLOWED_ROLES[actionType];
  const allowed = allowedRoles.includes(role as AppRole);
  return {
    allowed,
    requiredPermission,
    reason: allowed ? undefined : "Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.",
  };
}
