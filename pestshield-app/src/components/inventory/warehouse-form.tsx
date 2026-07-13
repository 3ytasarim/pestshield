"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Warehouse as WarehouseIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { warehouseFormSchema, type WarehouseFormValues } from "@/lib/validations/inventory";
import { WAREHOUSE_TYPE_LABELS } from "@/components/inventory/inventory-labels";
import type { WarehouseType } from "@/lib/mock/inventory";

const TYPE_OPTIONS: { value: WarehouseType; label: string }[] = [
  { value: "main", label: WAREHOUSE_TYPE_LABELS.main },
  { value: "vehicle", label: WAREHOUSE_TYPE_LABELS.vehicle },
  { value: "branch", label: WAREHOUSE_TYPE_LABELS.branch },
];

const EMPTY: WarehouseFormValues = {
  name: "",
  type: "main",
  address: "",
  manager: "",
  phone: "",
  capacityNote: "",
};

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WarehouseFormValues) => void;
}

export function WarehouseForm({ open, onOpenChange, onSubmit }: WarehouseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: WarehouseFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WarehouseIcon className="size-4.5 text-primary" />
            Yeni Depo Ekle
          </DialogTitle>
          <DialogDescription>Ana depo, araç stoğu veya şube deposu ekleyin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div>
            <Label className="mb-1.5">
              Depo Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ana Depo — Merkez"
              className="h-11 rounded-xl px-3.5"
              {...register("name")}
            />
            {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="mb-1.5">Depo Tipi</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                        field.value === option.value
                          ? "border-primary/20 bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <Label className="mb-1.5">
              Adres <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Tuzla OSB, İstanbul"
              className="h-11 rounded-xl px-3.5"
              {...register("address")}
            />
            {errors.address && <p className="mt-1.5 text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">
                Sorumlu Kişi <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ad Soyad" className="h-11 rounded-xl px-3.5" {...register("manager")} />
              {errors.manager && <p className="mt-1.5 text-xs text-destructive">{errors.manager.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5">
                Telefon <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="0532 000 00 00" className="h-11 rounded-xl px-3.5" {...register("phone")} />
              {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Kapasite Notu</Label>
            <Input placeholder="120 m² / Araç bagajı" className="h-11 rounded-xl px-3.5" {...register("capacityNote")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <WarehouseIcon className="size-4" />
              Depoyu Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
