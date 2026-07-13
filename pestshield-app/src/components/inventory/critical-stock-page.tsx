"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, PackageX, ShieldAlert, TrendingDown } from "lucide-react";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { AddStockForm } from "@/components/inventory/add-stock-form";
import { ProductCard } from "@/components/inventory/product-card";
import { NewProductForm } from "@/components/inventory/new-product-form";
import {
  products as initialProducts,
  getCriticalProducts,
  criticalSeverity,
  type Product,
} from "@/lib/mock/inventory";
import type { AddStockFormValues, NewProductFormValues } from "@/lib/validations/inventory";

export function CriticalStockPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const criticalProducts = useMemo(
    () => [...getCriticalProducts(products)].sort((a, b) => criticalSeverity(b) - criticalSeverity(a)),
    [products],
  );

  const outOfStockCount = useMemo(() => criticalProducts.filter((p) => p.currentStock <= 0).length, [criticalProducts]);

  const totalDeficit = useMemo(
    () => criticalProducts.reduce((sum, p) => sum + Math.max(0, p.criticalLevel - p.currentStock), 0),
    [criticalProducts],
  );

  function handleAddStock(values: AddStockFormValues) {
    setProducts((prev) =>
      prev.map((p) => (p.id === values.productId ? { ...p, currentStock: p.currentStock + values.quantity } : p)),
    );
    toast.success("Stok güncellendi");
  }

  function handleEditProduct(values: NewProductFormValues) {
    if (!editingProduct) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: values.name,
              category: values.category,
              unit: values.unit,
              warehouseId: values.warehouseId,
              manufacturer: values.manufacturer,
              currentStock: values.startingStock,
              criticalLevel: values.criticalLevel,
              type: values.isBiosidal ? "biosidal" : "diger",
              licenseNumber: values.isBiosidal ? values.licenseNumber : undefined,
              activeIngredient: values.isBiosidal ? values.activeIngredient : undefined,
              defaultDose: values.isBiosidal ? values.defaultDose : undefined,
              targetOrganisms: values.isBiosidal ? values.targetOrganisms : undefined,
            }
          : p,
      ),
    );
    setEditingProduct(null);
    toast.success("Ürün güncellendi");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Kritik Stok</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Kritik seviyenin altındaki ürünler, en aciliyetli olandan başlayarak sıralanır.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Kritik Ürün"
          value={criticalProducts.length}
          description="Kritik seviyenin altında"
          changePercent={criticalProducts.length > 0 ? 12 : -12}
          icon={AlertTriangle}
          accent="amber"
          delay={0.05}
        />
        <CrmKpiCard
          label="Stokta Yok"
          value={outOfStockCount}
          description="Stok seviyesi sıfır"
          changePercent={outOfStockCount > 0 ? 18 : -18}
          icon={PackageX}
          accent="purple"
          delay={0.1}
        />
        <CrmKpiCard
          label="Toplam Eksik Miktar"
          value={totalDeficit}
          description="Kritik seviyeye ulaşmak için gereken toplam"
          changePercent={totalDeficit > 0 ? 10 : -10}
          icon={TrendingDown}
          accent="blue"
          delay={0.15}
        />
      </div>

      {criticalProducts.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-destructive">
            <span className="font-semibold">{criticalProducts.length} ürün</span> kritik seviyenin altında —
            en kısa sürede stok girişi yapılması önerilir.
          </p>
        </div>
      )}

      {criticalProducts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Kritik stok yok"
          description="Şu anda kritik seviyenin altında hiçbir ürün bulunmuyor."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {criticalProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              delay={Math.min(index, 9) * 0.03}
              onAddStock={(p) => {
                setStockTargetProduct(p);
                setAddStockOpen(true);
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setEditOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <AddStockForm
        open={addStockOpen}
        onOpenChange={setAddStockOpen}
        products={products}
        defaultProductId={stockTargetProduct?.id}
        onSubmit={handleAddStock}
      />

      <NewProductForm
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSubmit={handleEditProduct}
        defaultValues={
          editingProduct
            ? {
                name: editingProduct.name,
                category: editingProduct.category,
                unit: editingProduct.unit,
                warehouseId: editingProduct.warehouseId,
                manufacturer: editingProduct.manufacturer,
                startingStock: editingProduct.currentStock,
                criticalLevel: editingProduct.criticalLevel,
                isBiosidal: editingProduct.type === "biosidal",
                licenseNumber: editingProduct.licenseNumber ?? "",
                activeIngredient: editingProduct.activeIngredient ?? "",
                defaultDose: editingProduct.defaultDose ?? "",
                targetOrganisms: editingProduct.targetOrganisms ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
