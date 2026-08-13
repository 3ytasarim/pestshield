"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Package, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { WarehouseCard } from "@/components/inventory/warehouse-card";
import { WarehouseForm } from "@/components/inventory/warehouse-form";
import { getCriticalProducts, getProductsForWarehouse, type Product, type Warehouse } from "@/lib/mock/inventory";
import type { WarehouseFormValues } from "@/lib/validations/inventory";

export function WarehousesPage({
  initialWarehouses,
  products,
}: {
  initialWarehouses: Warehouse[];
  products: Product[];
}) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const criticalCount = getCriticalProducts(products).length;

  async function handleCreate(values: WarehouseFormValues) {
    const res = await fetch("/api/inventory/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Depo eklenemedi");
      return;
    }
    const { warehouse } = (await res.json()) as { warehouse: Warehouse };
    setWarehouses((prev) => [...prev, warehouse]);
    toast.success("Depo eklendi");
  }

  async function handleUpdate(values: WarehouseFormValues) {
    if (!editingWarehouse) return;
    const res = await fetch(`/api/inventory/warehouses/${editingWarehouse.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Depo güncellenemedi");
      return;
    }
    setWarehouses((prev) => prev.map((w) => (w.id === data.warehouse.id ? data.warehouse : w)));
    toast.success("Depo güncellendi");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/inventory/warehouses/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message ?? "Depo silinemedi");
      return;
    }
    setWarehouses((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    toast.success("Depo silindi");
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Depolar</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Ana depo, araç stokları ve şube depolarındaki envanteri görüntüleyin.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingWarehouse(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Depo Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Depo"
          value={warehouses.length}
          description="Kayıtlı depo / araç stoğu"
          changePercent={4}
          icon={WarehouseIcon}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Toplam Ürün Çeşidi"
          value={products.length}
          description="Depolar arasında dağıtılmış"
          changePercent={6}
          icon={Package}
          accent="emerald"
          delay={0.1}
        />
        <CrmKpiCard
          label="Kritik Stok"
          value={criticalCount}
          description="Tüm depolarda kritik seviyenin altında"
          changePercent={criticalCount > 0 ? 12 : -12}
          icon={AlertTriangle}
          accent="amber"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((warehouse, index) => (
          <WarehouseCard
            key={warehouse.id}
            warehouse={warehouse}
            products={getProductsForWarehouse(warehouse.id, products)}
            delay={Math.min(index, 9) * 0.04}
            onEdit={(w) => {
              setEditingWarehouse(w);
              setFormOpen(true);
            }}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      <WarehouseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingWarehouse(null);
        }}
        onSubmit={editingWarehouse ? handleUpdate : handleCreate}
        editing={editingWarehouse}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Depoyu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} deposunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
