"use client";

import { useEffect, useState } from "react";
import { FileText, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate, formatDateTime } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";
import type { ServiceOrder } from "@/lib/mock/crm";

export default function CustomerPortalServicesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/service-orders")
      .then((res) => (res.ok ? res.json() : { serviceOrders: [] }))
      .then((data: { serviceOrders?: ServiceOrder[] }) => setOrders(data.serviceOrders ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleOpenContract(order: ServiceOrder) {
    if (!order.contractFileDataUrl) return;
    window.open(order.contractFileDataUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Hizmetler</h1>
        <p className="text-sm text-muted-foreground">İlaçlama firmanızın hesabınıza tanımladığı hizmet kayıtları.</p>
      </div>

      {!loading && orders.length === 0 ? (
        <EmptyState icon={Wrench} title="Henüz hizmet kaydı yok" description="İlaçlama firmanız bir hizmet tanımladığında burada görünür." />
      ) : (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Hizmet Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{orders.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="hidden md:table-cell">Hizmet Kayıt Tarihi</TableHead>
                  <TableHead className="hidden lg:table-cell">Sözleşme Başlangıç Bitiş Tarihi</TableHead>
                  <TableHead className="hidden sm:table-cell">İlgili Personel</TableHead>
                  <TableHead>Hizmet Onay</TableHead>
                  <TableHead className="hidden xl:table-cell">Hizmet Onay Tarihi</TableHead>
                  <TableHead className="hidden xl:table-cell">Periyot</TableHead>
                  <TableHead className="hidden xl:table-cell">Belge</TableHead>
                  <TableHead className="hidden xl:table-cell">Kroki</TableHead>
                  <TableHead>Sözleşme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{order.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {order.contractStartDate && order.contractEndDate ? (
                        <div className="flex flex-col text-xs">
                          <span>{formatDate(order.contractStartDate)}</span>
                          <span>{formatDate(order.contractEndDate)}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{order.assignedPersonnel || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full font-medium",
                          order.approved
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {order.approved ? "Onaylı" : "Onay Bekliyor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{formatDateTime(order.approvedAt)}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.periodDays}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.documentCount}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.sketchCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!order.contractFileDataUrl}
                        title={order.contractFileDataUrl ? "Sözleşmeyi Görüntüle" : "Sözleşme eklenmemiş"}
                        className={cn(order.contractFileDataUrl && "text-amber-500 hover:text-amber-500")}
                        onClick={() => handleOpenContract(order)}
                      >
                        <FileText className={cn("size-4", order.contractFileDataUrl && "fill-amber-500/15")} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
