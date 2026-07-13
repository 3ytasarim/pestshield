"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  MoreHorizontal,
  PenTool,
  Plus,
  RotateCcw,
  User,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { WorkOrderForm } from "@/components/crm/detail/work-order-form";
import { printWorkOrder } from "@/components/crm/detail/print-work-order";
import { getCustomerById, getWorkOrders, type WorkOrder } from "@/lib/mock/crm";
import { buildWorkOrderMessage, getWhatsAppLink } from "@/lib/integrations/whatsapp";
import type { WorkOrderFormValues } from "@/lib/validations/crm";

export function WorkHistoryTab({ customerId }: { customerId: string }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => getWorkOrders(customerId));
  const [detailOrder, setDetailOrder] = useState<WorkOrder | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const customer = getCustomerById(customerId);

  function reschedule(order: WorkOrder) {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, status: "planned", plannedDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10) }
          : o,
      ),
    );
    toast.success("İş emri yeniden planlandı");
  }

  function sendWorkOrderWhatsApp(order: WorkOrder) {
    if (!customer) return;
    const message = buildWorkOrderMessage({
      contactName: customer.contactName,
      companyName: customer.companyName,
      serviceType: order.serviceType,
      plannedDate: formatDate(order.plannedDate),
      technician: order.technician,
      orderNo: order.orderNo,
    });
    window.open(getWhatsAppLink(customer.contactPhone, message), "_blank");
  }

  function handleCreate(values: WorkOrderFormValues) {
    if (!customer) return;
    const seq = workOrders.length + 1;
    const newOrder: WorkOrder = {
      id: `${customerId}-wo-${Date.now()}`,
      customerId,
      orderNo: `IS-2026-${customer.accountCode.split("-")[1]}${String(seq).padStart(2, "0")}`,
      serviceType: values.serviceType,
      technician: values.technician,
      plannedDate: values.plannedDate,
      completedDate: null,
      status: "planned",
      riskFinding: null,
      hasReport: false,
      productsUsed: [],
      stationsChecked: 0,
      technicianNote: "",
      customerSigned: false,
    };
    setWorkOrders((prev) => [newOrder, ...prev]);
    toast.success("İş emri oluşturuldu", {
      action: {
        label: "WhatsApp ile Bildir",
        onClick: () => sendWorkOrderWhatsApp(newOrder),
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">İş Geçmişi</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni İş Emri
        </Button>
      </div>

      {workOrders.length === 0 ? (
        <EmptyState icon={History} title="Henüz servis kaydı yok" description="Bu müşteriye ait iş emri bulunmuyor." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İş Emri No</TableHead>
                <TableHead className="hidden xl:table-cell">Hizmet Türü</TableHead>
                <TableHead className="hidden md:table-cell">Teknisyen</TableHead>
                <TableHead className="hidden sm:table-cell">Planlanan Tarih</TableHead>
                <TableHead className="hidden lg:table-cell">Tamamlanma Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden xl:table-cell">Risk Bulgusu</TableHead>
                <TableHead className="hidden md:table-cell">Rapor</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNo}</TableCell>
                  <TableCell className="hidden xl:table-cell">{order.serviceType}</TableCell>
                  <TableCell className="hidden md:table-cell">{order.technician}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(order.plannedDate)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(order.completedDate)}</TableCell>
                  <TableCell>
                    <WorkOrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] truncate text-xs xl:table-cell">
                    {order.riskFinding ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.hasReport ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                          <Eye className="size-3.5" />
                          İş Detayı
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Rapor görüntüleme yakında eklenecek")}>
                          <FileText className="size-3.5" />
                          Rapor Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => customer && printWorkOrder(customer, order)}>
                          <Download className="size-3.5" />
                          PDF İndir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reschedule(order)}>
                          <RotateCcw className="size-3.5" />
                          Tekrar Planla
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => sendWorkOrderWhatsApp(order)}>
                          <WhatsAppIcon className="size-3.5" />
                          WhatsApp ile Gönder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>İş Emri Detayı · {detailOrder?.orderNo}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servis Özeti</p>
                <p className="mt-1">
                  {detailOrder.serviceType} · {formatDate(detailOrder.plannedDate)} ·{" "}
                  <WorkOrderStatusBadge status={detailOrder.status} />
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kullanılan Ürünler</p>
                <ul className="mt-1 list-inside list-disc">
                  {detailOrder.productsUsed.map((product) => (
                    <li key={product}>{product}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kontrol Edilen İstasyonlar
                </p>
                <p className="mt-1">{detailOrder.stationsChecked} istasyon kontrol edildi</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fotoğraflar</p>
                <div className="mt-1 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex size-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-xs text-muted-foreground"
                    >
                      Foto
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teknisyen Notu</p>
                <p className="mt-1 flex items-start gap-2">
                  <User className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  {detailOrder.technicianNote}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
                <PenTool className="size-4 text-muted-foreground" />
                <span>
                  Müşteri İmzası:{" "}
                  <span className={detailOrder.customerSigned ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                    {detailOrder.customerSigned ? "Alındı" : "Bekleniyor"}
                  </span>
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WorkOrderForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
