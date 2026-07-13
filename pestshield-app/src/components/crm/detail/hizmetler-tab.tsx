"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { HizmetForm, type ContractFileValue } from "@/components/crm/detail/hizmet-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { HizmetOnaySwitch } from "@/components/crm/hizmet-onay-switch";
import { getCustomerById, type ServiceOrder } from "@/lib/mock/crm";
import { addServiceOrder, buildServiceOrder, getServiceOrdersFor, toggleServiceOrderApproval } from "@/lib/service-order-store";
import type { HizmetFormValues } from "@/lib/validations/crm";

export function HizmetlerTab({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const customer = getCustomerById(customerId);

  useEffect(() => {
    setOrders(getServiceOrdersFor(customerId));
  }, [customerId]);

  function handleSubmit(values: HizmetFormValues, contract: ContractFileValue) {
    const newOrder = { ...buildServiceOrder(customerId, values), contractFileDataUrl: contract.fileDataUrl, contractFileName: contract.fileName };
    addServiceOrder(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    toast.success("Hizmet kaydedildi");
  }

  function handleToggleApproval(orderId: string) {
    toggleServiceOrderApproval(orderId);
    setOrders(getServiceOrdersFor(customerId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hizmetler</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Hizmet Ekle
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={Wrench} title="Henüz hizmet kaydı yok" description="Yeni bir hizmet ekleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hizmet No</TableHead>
                <TableHead className="hidden md:table-cell">Açıklama</TableHead>
                <TableHead className="hidden lg:table-cell">Sözleşme Tarihi</TableHead>
                <TableHead className="hidden sm:table-cell">İlgili Personel</TableHead>
                <TableHead className="hidden lg:table-cell">Periyot</TableHead>
                <TableHead>Hizmet Onay</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead className="hidden xl:table-cell">Oluşturulma Tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.serviceNo}</TableCell>
                  <TableCell className="hidden max-w-[220px] truncate md:table-cell">{order.description || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {order.contractStartDate && order.contractEndDate
                      ? `${formatDate(order.contractStartDate)} – ${formatDate(order.contractEndDate)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{order.assignedPersonnel || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{order.periodDays} gün</TableCell>
                  <TableCell>
                    <HizmetOnaySwitch approved={order.approved} onToggle={() => handleToggleApproval(order.id)} />
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell className="hidden xl:table-cell">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <HizmetForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} customer={customer ?? null} />
    </div>
  );
}
