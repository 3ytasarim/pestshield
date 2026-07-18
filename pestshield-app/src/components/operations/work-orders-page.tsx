"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Calendar, ClipboardList, FileCheck, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import type { WorkOrder, WorkOrderStatus } from "@/lib/mock/crm";
import { buildWorkOrderMessage, getWhatsAppLink } from "@/lib/integrations/whatsapp";
import { cn } from "@/lib/utils";

const COLUMNS: { status: WorkOrderStatus; label: string; accent: string }[] = [
  { status: "planned", label: "Planlandı", accent: "border-t-primary" },
  { status: "in_progress", label: "Devam Ediyor", accent: "border-t-violet-500" },
  { status: "delayed", label: "Gecikti", accent: "border-t-amber-500" },
  { status: "completed", label: "Tamamlandı", accent: "border-t-success" },
  { status: "cancelled", label: "İptal", accent: "border-t-muted-foreground" },
];

interface WorkOrderWithCustomer extends WorkOrder {
  customer: { id: string; companyName: string; contactName: string; contactPhone: string } | null;
}

export function WorkOrdersPage({ initialOrders }: { initialOrders: WorkOrderWithCustomer[] }) {
  const [search, setSearch] = useState("");

  const orders = initialOrders;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) => o.orderNo.toLowerCase().includes(q) || o.customer?.companyName.toLowerCase().includes(q) || o.technician.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => o.plannedDate === today).length;
  }, [orders]);

  const delayedCount = useMemo(() => orders.filter((o) => o.status === "delayed").length, [orders]);

  function columnOrders(status: WorkOrderStatus) {
    return filtered.filter((o) => o.status === status);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">İş Emirleri</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilere ait servis iş emirlerinin durum panosu.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam İş Emri" value={orders.length} description="Tüm müşteriler genelinde" changePercent={5} icon={ClipboardList} accent="blue" delay={0.05} />
        <CrmKpiCard label="Bugün Planlanan" value={todayCount} description="Bugüne planlanmış servisler" changePercent={4} icon={Calendar} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Gecikmiş" value={delayedCount} description="Termini geçmiş iş emri" changePercent={delayedCount > 0 ? 14 : -14} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İş emri no, müşteri veya teknisyen ara…" className="h-11 rounded-xl pl-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="İş emri bulunamadı" description="Arama kriterine uyan iş emri yok." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = columnOrders(col.status);
            return (
              <div key={col.status} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{col.label}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.map((order) => (
                    <Card key={order.id} className={cn(GLASS_CARD, "rounded-xl border-t-2 py-0", col.accent)}>
                      <CardContent className="flex flex-col gap-2 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{order.orderNo}</p>
                          <WorkOrderStatusBadge status={order.status} className="text-[10px]" />
                        </div>
                        {order.customer && (
                          <Link href={`/dashboard/client/customers/${order.customer.id}`} className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline">
                            {order.customer.companyName}
                          </Link>
                        )}
                        <p className="text-xs text-muted-foreground">{order.serviceType}</p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{order.technician}</span>
                          <span>{formatDate(order.plannedDate)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {order.hasReport ? (
                            <span className="flex items-center gap-1 text-[10px] text-success">
                              <FileCheck className="size-3" />
                              Rapor mevcut
                            </span>
                          ) : (
                            <span />
                          )}
                          {order.customer && (
                            <Button
                              size="icon-xs"
                              variant="outline"
                              className="border-success/30 text-success hover:bg-success/10"
                              aria-label="WhatsApp ile gönder"
                              onClick={() =>
                                window.open(
                                  getWhatsAppLink(
                                    order.customer!.contactPhone,
                                    buildWorkOrderMessage({
                                      contactName: order.customer!.contactName,
                                      companyName: order.customer!.companyName,
                                      serviceType: order.serviceType,
                                      plannedDate: formatDate(order.plannedDate),
                                      technician: order.technician,
                                      orderNo: order.orderNo,
                                    }),
                                  ),
                                  "_blank",
                                )
                              }
                            >
                              <WhatsAppIcon className="size-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">Boş</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
