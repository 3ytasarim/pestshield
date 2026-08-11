"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { CapaSeverityBadge, CapaStatusBadge } from "@/components/audit/audit-badges";
import { STANDARD_LABELS, isCapaOverdue, type CorrectiveAction } from "@/lib/mock/audit";
import { getCapaRows } from "@/lib/audit-report-data";
import { printCapaRaporu } from "@/lib/pdf/capa-report";
import { cn } from "@/lib/utils";

interface AuditTabProps {
  customerId: string;
  customerName: string;
}

export function AuditTab({ customerId, customerName }: AuditTabProps) {
  const [capas, setCapas] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/audit/corrective-actions?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setCapas(data.capas ?? []))
      .catch(() => toast.error("Düzeltici önleyici faaliyetler yüklenemedi"))
      .finally(() => setLoading(false));
  }, [customerId]);

  function viewReport(capa: CorrectiveAction) {
    printCapaRaporu(getCapaRows([capa], [{ id: customerId, companyName: customerName }]));
  }

  async function sendEmail(capa: CorrectiveAction) {
    setSendingEmailId(capa.id);
    try {
      const res = await fetch(`/api/audit/corrective-actions/${capa.id}/send-email`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Mail gönderilemedi");
        return;
      }
      toast.success("Mail gönderildi");
    } finally {
      setSendingEmailId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Düzeltici Önleyici Faaliyetler (DÖF)</h2>

      {!loading && capas.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="DÖF kaydı yok"
          description="Bu müşteriye bağlı henüz bir düzeltici önleyici faaliyet kaydı oluşturulmamış."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {capas.map((capa) => {
            const overdue = isCapaOverdue(capa);
            const isDone = capa.status === "resolved" || capa.status === "verified";
            return (
              <Card
                key={capa.id}
                className={cn(GLASS_CARD, "rounded-2xl border-l-4", overdue ? "border-l-destructive" : isDone ? "border-l-success" : "border-l-amber-500")}
              >
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{capa.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {capa.standard ? STANDARD_LABELS[capa.standard] : "Genel"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <CapaSeverityBadge severity={capa.severity} />
                      <CapaStatusBadge status={capa.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 rounded-xl bg-muted/30 p-3 text-xs sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-muted-foreground uppercase">Kök Neden</p>
                      <p className="mt-0.5 text-foreground/80">{capa.rootCause}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground uppercase">Aksiyon Planı</p>
                      <p className="mt-0.5 text-foreground/80">{capa.actionPlan}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Sorumlu: <span className="font-medium text-foreground">{capa.responsible}</span> · Vade:{" "}
                      <span className={cn("font-medium", overdue ? "text-destructive" : "text-foreground")}>{formatDate(capa.dueDate)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button size="sm" variant="outline" startContent={<FileText className="size-3.5" aria-hidden="true" />} onClick={() => viewReport(capa)}>
                        Raporu Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        startContent={<Mail className="size-3.5" aria-hidden="true" />}
                        loading={sendingEmailId === capa.id}
                        onClick={() => sendEmail(capa)}
                      >
                        Mail Gönder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
