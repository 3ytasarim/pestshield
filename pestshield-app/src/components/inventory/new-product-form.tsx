"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { FileText, PackagePlus, ShieldCheck, Sparkles, Upload } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TechnicianMultiSelect } from "@/components/crm/technician-multiselect";
import { cn } from "@/lib/utils";
import { readImageFile } from "@/lib/file-utils";
import { newProductFormSchema, type NewProductFormValues } from "@/lib/validations/inventory";
import { CATEGORY_OPTIONS, UNIT_OPTIONS, USAGE_AREA_OPTIONS } from "@/components/inventory/inventory-labels";
import type { ProductCategory, ProductUnit, Warehouse } from "@/lib/mock/inventory";

interface NewProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewProductFormValues) => void;
  defaultValues?: NewProductFormValues;
  warehouses: Warehouse[];
}

function PillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "border-primary/20 bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface FileDropzoneProps {
  label: string;
  fileName: string | null;
  onFileSelect: (dataUrl: string, fileName: string) => void;
}

/** PDF/JPG/PNG belge yükleme alanı — sürükle-bırak veya "Dosya Seç". Bkz. belge-tanimlama-dialog.tsx için aynı desen. */
function FileDropzone({ label, fileName, onFileSelect }: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelect(selected: File | undefined) {
    if (!selected) return;
    try {
      const dataUrl = await readImageFile(selected, 8);
      onFileSelect(dataUrl, selected.name);
    } catch {
      // readImageFile zaten anlaşılır bir hata fırlatır; burada sessizce yut, kullanıcı dosyayı tekrar seçebilir.
    }
  }

  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <div
        className={cn(
          "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border p-3 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
          fileName && "border-solid border-primary/20 bg-muted/30",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleSelect(e.dataTransfer.files?.[0]);
        }}
      >
        {fileName ? <FileText className="size-5 text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
        {fileName && <p className="max-w-full truncate text-xs font-medium text-foreground">{fileName}</p>}
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {fileName ? "Değiştir" : "Dosya Seç"}
        </Button>
        <p className="text-[11px] text-muted-foreground">Sürükle &amp; Bırak · PDF/JPG/PNG, maks. 8MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => handleSelect(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function NewProductForm({ open, onOpenChange, onSubmit, defaultValues, warehouses }: NewProductFormProps) {
  const EMPTY: NewProductFormValues = useMemo(
    () => ({
      name: "",
      category: "malzeme",
      unit: "adet",
      warehouseId: warehouses[0]?.id ?? "",
      manufacturer: "",
      startingStock: 0,
      criticalLevel: 0,
      isBiosidal: false,
      licenseNumber: "",
      activeIngredient: "",
      defaultDose: "",
      targetOrganisms: "",
      packageAmount: "",
      antidote: "",
      usageAreas: [],
      licenseFileDataUrl: null,
      licenseFileName: null,
      msdsFileDataUrl: null,
      msdsFileName: null,
    }),
    [warehouses],
  );
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewProductFormValues>({
    resolver: zodResolver(newProductFormSchema),
    defaultValues: defaultValues ?? EMPTY,
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset, EMPTY]);

  const isBiosidal = watch("isBiosidal");
  const productName = watch("name");
  const [aiLoading, setAiLoading] = useState(false);

  async function generateActiveIngredient() {
    if (!productName || productName.trim().length < 2) {
      toast.error("Önce Ürün Adı girin");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/inventory/products/ai-active-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "AI içerik oluşturamadı");
        return;
      }
      setValue("activeIngredient", data.activeIngredient, { shouldDirty: true });
      toast.success("AI önerisi eklendi — lütfen doğrulayın");
    } catch {
      toast.error("AI içerik oluşturulamadı");
    } finally {
      setAiLoading(false);
    }
  }

  function submit(values: NewProductFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 transition-[max-width] duration-300 max-w-md sm:max-w-lg",
          isBiosidal && "lg:max-w-4xl xl:max-w-5xl",
        )}
      >
        <DialogHeader className="shrink-0 p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-4.5 text-primary" />
            {defaultValues ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
          </DialogTitle>
          <DialogDescription>
            {defaultValues
              ? "Ürün bilgilerini güncelleyin."
              : "Envantere yeni bir ürün, malzeme veya ekipman ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div className={cn("grid grid-cols-1 gap-x-6 gap-y-4", isBiosidal && "lg:grid-cols-2")}>
          <div className="flex flex-col gap-3.5">
          <div>
            <Label className="mb-1.5">
              Ürün Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Temizlik solüsyonu…"
              className="h-11 rounded-xl px-3.5"
              {...register("name")}
            />
            {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {!isBiosidal && (
            <div>
              <Label className="mb-1.5">Üretici</Label>
              <Input placeholder="Marka / üretici" className="h-11 rounded-xl px-3.5" {...register("manufacturer")} />
            </div>
          )}

          <div>
            <Label className="mb-1.5">Kategori</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <PillGroup<ProductCategory> value={field.value} options={CATEGORY_OPTIONS} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <Label className="mb-1.5">Birim</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <PillGroup<ProductUnit> value={field.value} options={UNIT_OPTIONS} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <Label className="mb-1.5">
              Depo <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                    <SelectValue placeholder="Depo seçin…">
                      {(value: unknown) => warehouses.find((w) => w.id === value)?.name ?? "Depo seçin…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && <p className="mt-1.5 text-xs text-destructive">{errors.warehouseId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">
                {defaultValues ? "Mevcut Miktar" : "Başlangıç Miktarı"} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="0"
                className="h-11 rounded-xl px-3.5"
                {...register("startingStock", { valueAsNumber: true })}
              />
              {errors.startingStock && (
                <p className="mt-1.5 text-xs text-destructive">{errors.startingStock.message}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">
                Kritik Seviye <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                placeholder="min."
                className="h-11 rounded-xl px-3.5"
                {...register("criticalLevel", { valueAsNumber: true })}
              />
              {errors.criticalLevel && (
                <p className="mt-1.5 text-xs text-destructive">{errors.criticalLevel.message}</p>
              )}
            </div>
          </div>

          <Controller
            control={control}
            name="isBiosidal"
            render={({ field }) => (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/[0.06] px-3.5 py-3">
                <span className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Biyosidal Ürün mü?</span>
                    <span className="text-xs text-muted-foreground">Ruhsat, aktif madde ve doz bilgileri</span>
                  </span>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
          </div>

          <AnimatePresence initial={false}>
            {isBiosidal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3.5 border-t-2 border-success/30 pt-3.5 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-6">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Controller
                      control={control}
                      name="licenseFileDataUrl"
                      render={({ field: dataUrlField }) => (
                        <Controller
                          control={control}
                          name="licenseFileName"
                          render={({ field: nameField }) => (
                            <FileDropzone
                              label="Ürün Ruhsatı"
                              fileName={nameField.value}
                              onFileSelect={(dataUrl, fileName) => {
                                dataUrlField.onChange(dataUrl);
                                nameField.onChange(fileName);
                              }}
                            />
                          )}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="msdsFileDataUrl"
                      render={({ field: dataUrlField }) => (
                        <Controller
                          control={control}
                          name="msdsFileName"
                          render={({ field: nameField }) => (
                            <FileDropzone
                              label="Ürün MSDS"
                              fileName={nameField.value}
                              onFileSelect={(dataUrl, fileName) => {
                                dataUrlField.onChange(dataUrl);
                                nameField.onChange(fileName);
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Ruhsat Tarihi ve Sayısı</Label>
                    <Input
                      placeholder="Örn: 2024/123"
                      className="h-11 rounded-xl px-3.5"
                      {...register("licenseNumber")}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1.5">Ürün Ambalaj Miktarı (Kg / LT)</Label>
                      <Input placeholder="Örn: 5 LT" className="h-11 rounded-xl px-3.5" {...register("packageAmount")} />
                    </div>
                    <div>
                      <Label className="mb-1.5">Varsayılan Doz</Label>
                      <Input
                        placeholder="25 g / 5 lt su"
                        className="h-11 rounded-xl px-3.5"
                        {...register("defaultDose")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5">Ürün Aktif Maddeleri</Label>
                    <Textarea
                      placeholder="Örn: Deltamethrin %25, Piperonil Bütoksit %5"
                      className="min-h-20 rounded-xl px-3.5 py-2.5"
                      {...register("activeIngredient")}
                    />
                    <Button type="button" size="sm" variant="outline" className="mt-1.5" loading={aiLoading} onClick={generateActiveIngredient}>
                      <Sparkles className="size-3.5" />
                      AI ile İçerik Oluştur
                    </Button>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      AI&apos;nin kendi bilgisine dayanır, internet taraması yapmaz — mutlaka doğrulayın.
                    </p>
                  </div>
                  <div>
                    <Label className="mb-1.5">Ürün Antidotu</Label>
                    <Input placeholder="Örn: Yok" className="h-11 rounded-xl px-3.5" {...register("antidote")} />
                  </div>
                  <div>
                    <Label className="mb-1.5">Hedef Organizmalar</Label>
                    <Input
                      placeholder="Hamamböceği, karasinek…"
                      className="h-11 rounded-xl px-3.5"
                      {...register("targetOrganisms")}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="usageAreas"
                    render={({ field }) => (
                      <TechnicianMultiSelect
                        label="Ürün Kullanım Yeri"
                        value={field.value.join(", ")}
                        onChange={(v) =>
                          field.onChange(
                            v
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                        options={USAGE_AREA_OPTIONS}
                      />
                    )}
                  />
                  <div>
                    <Label className="mb-1.5">Üretici</Label>
                    <Input
                      placeholder="Bayer, Syngenta…"
                      className="h-11 rounded-xl px-3.5"
                      {...register("manufacturer")}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <DialogFooter className="sticky bottom-0 z-10 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <PackagePlus className="size-4" />
              {defaultValues ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
