"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkOrder } from "@/lib/mock/crm";

export default function CustomerPortalWorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    fetch("/api/portal/work-orders")
      .then((res) => res.json())
      .then((data) => setWorkOrders(data.workOrders))
      .catch(() => toast.error("Hizmet geçmişi yüklenemedi"));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Hizmet Geçmişi</h1>

      {workOrders === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : workOrders.length === 0 ? (
        <EmptyState icon={History} title="Henüz servis kaydı yok" description="Hesabınıza ait bir iş emri bulunmuyor." />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İş Emri No</TableHead>
                <TableHead className="hidden sm:table-cell">Hizmet Türü</TableHead>
                <TableHead className="hidden md:table-cell">Teknisyen</TableHead>
                <TableHead>Planlanan Tarih</TableHead>
                <TableHead className="hidden lg:table-cell">Tamamlanma Tarihi</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNo}</TableCell>
                  <TableCell className="hidden sm:table-cell">{order.serviceType}</TableCell>
                  <TableCell className="hidden md:table-cell">{order.technician}</TableCell>
                  <TableCell>{formatDate(order.plannedDate)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(order.completedDate)}</TableCell>
                  <TableCell>
                    <WorkOrderStatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
