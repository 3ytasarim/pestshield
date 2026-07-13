"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  Download,
  History,
  Package,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { AddStockForm } from "@/components/inventory/add-stock-form";
import { NewProductForm } from "@/components/inventory/new-product-form";
import { ProductCard } from "@/components/inventory/product-card";
import { UsageHistoryTab } from "@/components/inventory/usage-history-tab";
import { CATEGORY_OPTIONS } from "@/components/inventory/inventory-labels";
import {
  products as initialProducts,
  stockTransactions as initialTransactions,
  getCriticalProducts,
  type Product,
  type ProductCategory,
} from "@/lib/mock/inventory";
import type { AddStockFormValues, NewProductFormValues } from "@/lib/validations/inventory";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | ProductCategory;
type TypeFilter = "all" | "biosidal" | "diger";

function downloadCsvTemplate() {
  const headers = ["Ürün Adı", "Kategori", "Birim", "Üretici", "Başlangıç Miktarı", "Kritik Seviye", "Biyosidal (Evet/Hayır)"];
  const csv = "﻿" + headers.join(";") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "envanter-sablonu.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("products");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      return true;
    });
  }, [products, categoryFilter, typeFilter]);

  const criticalProducts = useMemo(() => getCriticalProducts(products), [products]);

  const thisMonthTransactionCount = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return transactions.filter((t) => t.date.startsWith(ym)).length;
  }, [transactions]);

  function categoryCount(category: ProductCategory) {
    return products.filter((p) => p.category === category).length;
  }

  function typeCount(type: "biosidal" | "diger") {
    return products.filter((p) => p.type === type).length;
  }

  function handleAddStock(values: AddStockFormValues) {
    setProducts((prev) =>
      prev.map((p) => (p.id === values.productId ? { ...p, currentStock: p.currentStock + values.quantity } : p)),
    );
    setTransactions((prev) => [
      {
        id: `txn-${Date.now()}`,
        productId: values.productId,
        type: "add",
        quantity: values.quantity,
        description: values.description,
        performedBy: "Siz",
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    toast.success("Stok güncellendi");
  }

  function handleNewProduct(values: NewProductFormValues) {
    if (editingProduct) {
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
      return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: values.name,
      category: values.category,
      unit: values.unit,
      warehouseId: values.warehouseId,
      manufacturer: values.manufacturer,
      currentStock: values.startingStock,
      criticalLevel: values.criticalLevel,
      type: values.isBiosidal ? "biosidal" : "diger",
      createdAt: new Date().toISOString().slice(0, 10),
      licenseNumber: values.isBiosidal ? values.licenseNumber : undefined,
      activeIngredient: values.isBiosidal ? values.activeIngredient : undefined,
      defaultDose: values.isBiosidal ? values.defaultDose : undefined,
      targetOrganisms: values.isBiosidal ? values.targetOrganisms : undefined,
    };
    setProducts((prev) => [newProduct, ...prev]);
    toast.success("Ürün eklendi");
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Envanter</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            İlaç, malzeme ve ekipman stoklarını tek merkezden takip edin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => downloadCsvTemplate()}>
            <Download className="size-4" />
            Şablon İndir
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStockTargetProduct(null);
              setAddStockOpen(true);
            }}
          >
            <Boxes className="size-4" />
            Stok Ekle
          </Button>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setNewProductOpen(true);
            }}
          >
            <PackagePlus className="size-4" />
            Yeni Ürün
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Ürün Çeşidi"
          value={products.length}
          description="Envanterdeki toplam ürün"
          changePercent={6}
          icon={Package}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Kritik Stok"
          value={criticalProducts.length}
          description="Kritik seviyenin altında"
          changePercent={criticalProducts.length > 0 ? 12 : -12}
          icon={AlertTriangle}
          accent="amber"
          delay={0.1}
        />
        <CrmKpiCard
          label="Bu Ay İşlem"
          value={thisMonthTransactionCount}
          description="Stok giriş/kullanım hareketi"
          changePercent={8}
          icon={History}
          accent="emerald"
          delay={0.15}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))}>
        <TabsList variant="line">
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="size-3.5" />
            Ürünler
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-3.5" />
            Kullanım Geçmişi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                Tümü ({products.length})
              </button>
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategoryFilter(option.value)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    categoryFilter === option.value
                      ? "border-primary/20 bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {option.label} ({categoryCount(option.value)})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  typeFilter === "all" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("biosidal")}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  typeFilter === "biosidal"
                    ? "border-success/20 bg-success text-success-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <ShieldCheck className="size-3.5" />
                Biyosidal ({typeCount("biosidal")})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("diger")}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  typeFilter === "diger"
                    ? "border-success/20 bg-success text-success-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                Diğer ({typeCount("diger")})
              </button>
            </div>
          </div>

          {criticalProducts.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-destructive">
                <span className="font-semibold">{criticalProducts.map((p) => p.name).join(", ")}</span> kritik
                seviyenin altında.
              </p>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="Ürün bulunamadı" description="Seçili filtrelere uyan ürün yok." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product, index) => (
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
                    setNewProductOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <UsageHistoryTab />
        </TabsContent>
      </Tabs>

      <AddStockForm
        open={addStockOpen}
        onOpenChange={setAddStockOpen}
        products={products}
        defaultProductId={stockTargetProduct?.id}
        onSubmit={handleAddStock}
      />

      <NewProductForm
        open={newProductOpen}
        onOpenChange={(open) => {
          setNewProductOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSubmit={handleNewProduct}
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
