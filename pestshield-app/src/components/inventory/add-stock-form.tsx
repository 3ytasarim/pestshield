"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus } from "lucide-react";
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
import { addStockFormSchema, type AddStockFormValues } from "@/lib/validations/inventory";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import type { Product } from "@/lib/mock/inventory";

const QUICK_AMOUNTS = [5, 10, 25, 50];

const EMPTY: AddStockFormValues = {
  productId: "",
  quantity: 0,
  description: "",
};

interface AddStockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  defaultProductId?: string;
  onSubmit: (values: AddStockFormValues) => void;
}

export function AddStockForm({ open, onOpenChange, products, defaultProductId, onSubmit }: AddStockFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStockFormValues>({
    resolver: zodResolver(addStockFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset({ ...EMPTY, productId: defaultProductId ?? "" });
  }, [open, defaultProductId, reset]);

  const productId = watch("productId");
  const selectedProduct = products.find((p) => p.id === productId);
  const quantity = watch("quantity");

  function submit(values: AddStockFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-4.5 text-primary" />
            Stok Ekle
          </DialogTitle>
          <DialogDescription>Mevcut bir ürüne stok girişi yapın.</DialogDescription>
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
                  <SelectContent>
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
          </div>

          <div>
            <Label className="mb-1.5">
              Eklenecek Miktar {selectedProduct ? `(${UNIT_LABELS[selectedProduct.unit]})` : ""}{" "}
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("quantity", (quantity || 0) + amount, { shouldValidate: true })}
                >
                  +{amount}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Açıklama</Label>
            <Textarea
              placeholder="Tedarikçi, sipariş no…"
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
              <PackagePlus className="size-4" />
              Stoku Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
