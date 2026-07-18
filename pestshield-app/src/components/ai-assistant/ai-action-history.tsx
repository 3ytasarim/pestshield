"use client";

import { History, CheckCircle2, OctagonX, Clock, Ban } from "lucide-react";
import { formatDate } from "@/components/crm/crm-format";
import type { AiActionAuditEntry } from "@/lib/ai/actions/audit";

const ACTION_LABELS: Record<AiActionAuditEntry["actionType"], string> = {
  create_service: "Servis Oluşturma",
  reschedule_service: "Servis Erteleme",
  assign_technician: "Teknisyen Atama",
  create_followup_task: "Takip Görevi",
  prepare_email: "E-posta Taslağı",
  send_email: "E-posta Gönderimi",
  send_whatsapp_message: "WhatsApp Mesajı",
};

function statusIcon(status: AiActionAuditEntry["resultStatus"]) {
  if (status === "completed") return <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />;
  if (status === "failed" || status === "invalid") return <OctagonX className="size-3.5 text-destructive" aria-hidden="true" />;
  if (status === "cancelled") return <Ban className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  return <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />;
}

function statusLabel(status: AiActionAuditEntry["resultStatus"]) {
  switch (status) {
    case "completed":
      return "Tamamlandı";
    case "failed":
      return "Başarısız";
    case "invalid":
      return "Geçersiz";
    case "cancelled":
      return "Vazgeçildi";
    case "expired":
      return "Süresi Doldu";
    default:
      return status;
  }
}

/** Bu kullanıcının Faz 3 aksiyon geçmişini gösterir — bkz. src/lib/ai/actions/audit.ts. Yalnızca çağıranın kendi kayıtları (kullanıcı bazlı localStorage anahtarı). */
export function AiActionHistory({ entries }: { entries: AiActionAuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
        <History className="size-5 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">Henüz gerçekleştirilmiş bir aksiyon yok.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              {statusIcon(entry.resultStatus)}
              {ACTION_LABELS[entry.actionType]}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
          </div>
          {entry.targetEntityName && <p className="mt-0.5 text-muted-foreground">{entry.targetEntityName}</p>}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {statusLabel(entry.resultStatus)}
            {entry.errorMessage ? ` — ${entry.errorMessage}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
