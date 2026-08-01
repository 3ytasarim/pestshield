"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferStockFormSchema, type TransferStockFormValues } from "@/lib/validations/inventory";
import { UNIT_LABELS, WAREHOUSE_TYPE_LABELS } from "@/components/inventory/inventory-labels";
import type { Product, Warehouse } from "@/lib/mock/inventory";

const EMPTY: TransferStockFormValues = {
  productId: "",
  toWarehouseId: "",
  quantity: 0,
  description: "",
};

interface TransferStockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  warehouses: Warehouse[];
  defaultProductId?: string;
  onSubmit: (values: TransferStockFormValues) => void;
}

export function TransferStockForm({ open, onOpenChange, products, warehouses, defaultProductId, onSubmit }: TransferStockFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferStockFormValues>({
    resolver: zodResolver(transferStockFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset({ ...EMPTY, productId: defaultProductId ?? "" });
  }, [open, defaultProductId, reset]);

  const productId = watch("productId");
  const selectedProduct = products.find((p) => p.id === productId);
  const destinationOptions = warehouses.filter((w) => w.id !== selectedProduct?.warehouseId);
  const sourceWarehouse = warehouses.find((w) => w.id === selectedProduct?.warehouseId);

  function submit(values: TransferStockFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-4.5 text-primary" />
            Stok Transferi
          </DialogTitle>
          <DialogDescription>Bir ürünü depolar veya araçlar arasında aktarın.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div>
            <Label className="mb-1.5">
              Ürün <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                    <SelectValue placeholder="Ürün seçin…">
                      {(value: unknown) => products.find((p) => p.id === value)?.name ?? "Ürün seçin…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && <p className="mt-1.5 text-xs text-destructive">{errors.productId.message}</p>}
            {sourceWarehouse && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mevcut depo: {sourceWarehouse.name} ({WAREHOUSE_TYPE_LABELS[sourceWarehouse.type]}) — {selectedProduct?.currentStock}{" "}
                {selectedProduct ? UNIT_LABELS[selectedProduct.unit] : ""}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5">
              Hedef Depo / Araç <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="toWarehouseId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!productId}>
                  <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                    <SelectValue placeholder={productId ? "Hedef seçin…" : "Önce ürün seçin…"}>
                      {(value: unknown) => destinationOptions.find((w) => w.id === value)?.name ?? "Hedef seçin…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {destinationOptions.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({WAREHOUSE_TYPE_LABELS[warehouse.type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toWarehouseId && <p className="mt-1.5 text-xs text-destructive">{errors.toWarehouseId.message}</p>}
          </div>

          <div>
            <Label className="mb-1.5">
              Transfer Edilecek Miktar {selectedProduct ? `(${UNIT_LABELS[selectedProduct.unit]})` : ""}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="any"
              placeholder="0"
              className="h-11 rounded-xl px-3.5"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && <p className="mt-1.5 text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div>
            <Label className="mb-1.5">Açıklama</Label>
            <Textarea
              placeholder="Transfer nedeni, teslim eden…"
              rows={2}
              className="rounded-xl px-3.5 py-2.5"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!productId}>
              <ArrowLeftRight className="size-4" />
              Transfer Et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
