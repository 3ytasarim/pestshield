"use client";

// PestShield AI Command Center — Faz 4 arka plan iş (background job) soyutlaması.
//
// Denetim bulgusu: bu uygulamada hiçbir cron/kuyruk/worker altyapısı yok
// (node-cron, bullmq, agenda vb. hiçbiri package.json'da değil) ve gerçek
// bir sunucu tarafı zamanlayıcı da yok. Bu yüzden burada DAR bir arayüz
// tanımlanır ve GELİŞTİRME ortamı için dürüst, istemci tabanlı bir
// implementasyon (ClientIntervalJobProvider) sağlanır — bu, tarayıcı sekmesi
// açıkken çalışan bir setInterval'dan İBARETTİR, gerçek bir arka plan
// worker'ı DEĞİLDİR (sekme kapanınca durur, birden fazla kullanıcı arasında
// paylaşılmaz). ÜRETİMDE bunun yerine bir Vercel Cron + `/api/cron/*` uç
// noktası (veya eşdeğer bir zamanlayıcı/worker süreci) gereklidir — bu
// dosya o gerçek implementasyonun takılacağı arayüzü tanımlar.

export type BackgroundJobName =
  | "evaluate_alert_rules"
  | "generate_daily_briefings"
  | "send_scheduled_notifications"
  | "retry_failed_whatsapp_messages"
  | "resolve_inactive_alerts"
  | "process_escalations";

export interface BackgroundJobProvider {
  readonly name: string;
  register(job: BackgroundJobName, intervalMs: number, handler: () => void | Promise<void>): void;
  unregisterAll(): void;
}

/** Yalnızca geliştirme/tek-sekme senaryosu için — bkz. dosya başındaki uyarı. */
export class ClientIntervalJobProvider implements BackgroundJobProvider {
  readonly name = "client-interval-dev-only";
  private handles: ReturnType<typeof setInterval>[] = [];

  register(_job: BackgroundJobName, intervalMs: number, handler: () => void | Promise<void>): void {
    void handler();
    this.handles.push(setInterval(() => void handler(), intervalMs));
  }

  unregisterAll(): void {
    this.handles.forEach(clearInterval);
    this.handles = [];
  }
}
