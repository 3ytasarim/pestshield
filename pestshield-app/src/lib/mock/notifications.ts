// Bildirim Merkezi tip tanımları. Bildirimlerin gerçek üretimi
// `@/lib/notifications/build` içinde, giriş yapan firmanın kendi Postgres
// verilerinden yapılır — burada sahte veri TUTULMAZ.

export type NotificationType = "work_order" | "contract" | "stock" | "station" | "capa" | "risk" | "payment" | "fleet";
export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: NotificationPriority;
  link: string | null;
}

export function getUnreadCount(list: Notification[]): number {
  return list.filter((n) => !n.read).length;
}
