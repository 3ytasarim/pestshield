"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ChartNoAxesCombined,
  Clock,
  FileCheck2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Pencil,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { HizmetForm, type ContractFileValue } from "@/components/crm/detail/hizmet-form";
import { HizmetOnaySwitch } from "@/components/crm/hizmet-onay-switch";
import { BelgeTanimlamaDialog } from "@/components/crm/belge-tanimlama-dialog";
import { KrokiDialog } from "@/components/crm/kroki-dialog";
import { PeriyotDialog } from "@/components/crm/periyot-dialog";
import { TrendAnalizDialog } from "@/components/crm/trend-analiz-dialog";
import { formatCurrency, formatDate, formatDateTime } from "@/components/crm/crm-format";
import { getCustomerById, type ServiceOrder } from "@/lib/mock/crm";
import {
  loadServiceOrders,
  toggleServiceOrderApproval,
  updateServiceOrder,
  buildServiceOrder,
  deleteServiceOrders,
} from "@/lib/service-order-store";
import type { HizmetFormValues } from "@/lib/validations/crm";
import { cn } from "@/lib/utils";

export function HizmetlerPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [search, setSearch] = useState("");
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [belgeOrderId, setBelgeOrderId] = useState<string | null>(null);
  const [krokiOrderId, setKrokiOrderId] = useState<string | null>(null);
  const [periyotOrderId, setPeriyotOrderId] = useState<string | null>(null);
  const [trendOrderId, setTrendOrderId] = useState<string | null>(null);
  const periyotCustomer = periyotOrderId
    ? (getCustomerById(orders.find((o) => o.id === periyotOrderId)?.customerId ?? "") ?? null)
    : null;
  const trendOrder = trendOrderId ? (orders.find((o) => o.id === trendOrderId) ?? null) : null;
  const krokiOrder = krokiOrderId ? (orders.find((o) => o.id === krokiOrderId) ?? null) : null;

  useEffect(() => {
    setOrders(loadServiceOrders());
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rows = useMemo(
    () => orders.map((order) => ({ order, customer: getCustomerById(order.customerId) })),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      ({ order, customer }) =>
        customer?.companyName.toLowerCase().includes(q) ||
        order.serviceNo.toLowerCase().includes(q) ||
        order.assignedPersonnel.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const approvedCount = useMemo(() => orders.filter((o) => o.approved).length, [orders]);
  const totalAmount = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const allSelected = filtered.length > 0 && filtered.every(({ order }) => selectedIds.has(order.id));

  function refresh() {
    setOrders(loadServiceOrders());
  }

  function handleToggleApproval(id: string) {
    toggleServiceOrderApproval(id);
    refresh();
  }

  function handleDocumentCountChange(serviceOrderId: string, count: number) {
    updateServiceOrder(serviceOrderId, { documentCount: count });
    refresh();
  }

  function handleSketchCountChange(serviceOrderId: string, count: number) {
    updateServiceOrder(serviceOrderId, { sketchCount: count });
    refresh();
  }

  function handleEditSubmit(values: HizmetFormValues, contract: ContractFileValue) {
    if (!editingOrder) return;
    const updated = buildServiceOrder(editingOrder.customerId, values, editingOrder);
    updateServiceOrder(editingOrder.id, { ...updated, contractFileDataUrl: contract.fileDataUrl, contractFileName: contract.fileName });
    refresh();
    setEditingOrder(null);
    toast.success("Hizmet güncellendi");
  }

  function handleOpenContract(order: ServiceOrder) {
    if (!order.contractFileDataUrl) return;
    window.open(order.contractFileDataUrl, "_blank", "noopener,noreferrer");
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allSelected) return new Set();
      return new Set(filtered.map(({ order }) => order.id));
    });
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    deleteServiceOrders(Array.from(selectedIds));
    setSelectedIds(new Set());
    setConfirmDelete(false);
    refresh();
    toast.success("Seçili hizmet kayıtları silindi");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Hizmetler</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Müşterilere eklenen tüm hizmet kayıtlarının tek merkezden takibi.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Hizmet Kaydı" value={orders.length} description="Tüm müşteriler" changePercent={5} icon={Wrench} accent="blue" delay={0.05} />
        <CrmKpiCard label="Onaylı Hizmet" value={approvedCount} description="Onaylanmış kayıtlar" changePercent={approvedCount > 0 ? 6 : -6} icon={FileCheck2} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Toplam Tutar" value={totalAmount} format={(v) => formatCurrency(v)} description="Tüm hizmet kayıtlarının toplamı" changePercent={8} icon={FileText} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri, hizmet no veya personel ara…" className="h-11 rounded-xl pl-10" />
        </div>
        {selectedIds.size > 0 && (
          <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" />
            Seçimi Sil ({selectedIds.size})
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Hizmet kaydı bulunamadı" description="Müşteri Listesi'nden bir müşteriye hizmet ekleyin." />
      ) : (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Hizmet Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Tümünü seç" />
                  </TableHead>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden md:table-cell">Hizmet Kayıt Tarihi</TableHead>
                  <TableHead className="hidden lg:table-cell">Sözleşme Başlangıç Bitiş Tarihi</TableHead>
                  <TableHead className="hidden sm:table-cell">İlgili Personel</TableHead>
                  <TableHead>Hizmet Onay</TableHead>
                  <TableHead className="hidden xl:table-cell">Hizmet Onay Tarihi</TableHead>
                  <TableHead className="hidden xl:table-cell">Periyot</TableHead>
                  <TableHead className="hidden xl:table-cell">Belge</TableHead>
                  <TableHead className="hidden xl:table-cell">Kroki</TableHead>
                  <TableHead className="hidden lg:table-cell">Sözleşme</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ order, customer }, index) => (
                  <TableRow key={order.id} className={cn(selectedIds.has(order.id) && "bg-muted/40")}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelectRow(order.id)}
                        aria-label="Kaydı seç"
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {customer ? (
                        <Link href={`/dashboard/client/customers/${customer.id}`} className="hover:text-primary hover:underline">
                          {customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <p className="text-xs font-normal text-muted-foreground">{customer?.customerType ?? "—"}</p>
                    </TableCell>
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
                      <HizmetOnaySwitch approved={order.approved} onToggle={() => handleToggleApproval(order.id)} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{formatDateTime(order.approvedAt)}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.periodDays}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.documentCount}</TableCell>
                    <TableCell className="hidden xl:table-cell">{order.sketchCount}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!order.contractFileDataUrl}
                        title={order.contractFileDataUrl ? "Sözleşmeyi Görüntüle" : "Sözleşme eklemek için Düzenle'yi kullanın"}
                        className={cn(order.contractFileDataUrl && "text-amber-500 hover:text-amber-500")}
                        onClick={() => handleOpenContract(order)}
                      >
                        <FileText className={cn("size-4", order.contractFileDataUrl && "fill-amber-500/15")} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Belge Tanımlama"
                          className={cn(order.documentCount > 0 && "text-primary hover:text-primary")}
                          onClick={() => setBelgeOrderId(order.id)}
                        >
                          <FolderOpen className={cn("size-4", order.documentCount > 0 && "fill-primary/15")} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Periyot" onClick={() => setPeriyotOrderId(order.id)}>
                          <Clock className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Kroki Tanımlama"
                          className={cn(order.sketchCount > 0 && "text-success hover:text-success")}
                          onClick={() => setKrokiOrderId(order.id)}
                        >
                          <ImageIcon className={cn("size-4", order.sketchCount > 0 && "fill-success/20")} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Trend Analiz Raporu" onClick={() => setTrendOrderId(order.id)}>
                          <ChartNoAxesCombined className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Düzenle" onClick={() => setEditingOrder(order)}>
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BelgeTanimlamaDialog
        open={!!belgeOrderId}
        onOpenChange={(open) => !open && setBelgeOrderId(null)}
        serviceOrderId={belgeOrderId}
        onCountChange={handleDocumentCountChange}
      />

      <KrokiDialog
        open={!!krokiOrderId}
        onOpenChange={(open) => !open && setKrokiOrderId(null)}
        serviceOrderId={krokiOrderId}
        onCountChange={handleSketchCountChange}
        customerId={krokiOrder?.customerId ?? null}
        serviceName={krokiOrder?.description ?? ""}
      />

      <PeriyotDialog
        open={!!periyotOrderId}
        onOpenChange={(open) => !open && setPeriyotOrderId(null)}
        serviceOrderId={periyotOrderId}
        namePrefix={periyotCustomer?.companyName.split(" ")[0].toUpperCase() ?? "PCO"}
        customerName={periyotCustomer?.companyName ?? ""}
        customerId={periyotCustomer?.id ?? null}
      />

      <TrendAnalizDialog
        open={!!trendOrderId}
        onOpenChange={(open) => !open && setTrendOrderId(null)}
        serviceOrderId={trendOrderId}
        customerId={trendOrder?.customerId ?? null}
        serviceName={trendOrder?.description ?? ""}
      />

      <HizmetForm
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        onSubmit={handleEditSubmit}
        customer={editingOrder ? (getCustomerById(editingOrder.customerId) ?? null) : null}
        existingContract={editingOrder ? { fileDataUrl: editingOrder.contractFileDataUrl, fileName: editingOrder.contractFileName } : undefined}
        defaultValues={
          editingOrder
            ? {
                description: editingOrder.description,
                contractStartDate: editingOrder.contractStartDate,
                contractEndDate: editingOrder.contractEndDate,
                assignedPersonnel: editingOrder.assignedPersonnel,
                periodDays: editingOrder.periodDays,
                withholdingTax: editingOrder.withholdingTax,
                items: editingOrder.items,
              }
            : undefined
        }
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Hizmet kayıtlarını sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Seçili {selectedIds.size} hizmet kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
