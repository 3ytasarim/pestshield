"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextField, TextareaField, SelectField, CurrencyField, FormSectionTitle } from "@/components/crm/form-fields";
import { formatCurrency } from "@/components/crm/crm-format";
import { offerFormSchema, type OfferFormValues } from "@/lib/validations/crm";
import { SERVICE_TYPE_OPTIONS } from "@/components/crm/crm-labels";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import type { Offer } from "@/lib/mock/crm";

const EMPTY: OfferFormValues = {
  title: "",
  serviceType: "",
  description: "",
  items: [{ description: "", unitPrice: 0, quantity: 1 }],
  vatRate: 20,
  validUntil: "",
  notes: "",
  fileDataUrl: null,
  fileName: null,
  fileSizeKb: 0,
};

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function isAllowedOfferFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.has(file.type) || /\.(pdf|docx?)$/i.test(file.name);
}

interface OfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OfferFormValues) => void;
  editing?: Offer | null;
}

export function OfferForm({ open, onOpenChange, onSubmit, editing }: OfferFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OfferFormValues>({ resolver: zodResolver(offerFormSchema), defaultValues: EMPTY });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });
  const vatRate = useWatch({ control, name: "vatRate" });
  const fileName = useWatch({ control, name: "fileName" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    if (!isAllowedOfferFile(selected)) {
      toast.error("Lütfen bir PDF veya Word dosyası seçin");
      return;
    }
    setUploadingFile(true);
    try {
      const dataUrl = await readImageFile(selected, 10);
      setValue("fileDataUrl", dataUrl, { shouldDirty: true });
      setValue("fileName", selected.name, { shouldDirty: true });
      setValue("fileSizeKb", Math.round(selected.size / 1024), { shouldDirty: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
    } finally {
      setUploadingFile(false);
    }
  }

  function handleRemoveFile() {
    setValue("fileDataUrl", null, { shouldDirty: true });
    setValue("fileName", null, { shouldDirty: true });
    setValue("fileSizeKb", 0, { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const { subtotal, total } = useMemo(() => {
    const sub = (items ?? []).reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);
    return { subtotal: sub, total: sub * (1 + (vatRate || 0) / 100) };
  }, [items, vatRate]);

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              title: editing.title,
              serviceType: "",
              description: "",
              items: editing.items.map((item) => ({
                description: item.description,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
              })),
              vatRate: 20,
              validUntil: editing.validUntil,
              notes: "",
              fileDataUrl: editing.fileDataUrl,
              fileName: editing.fileName,
              fileSizeKb: editing.fileSizeKb,
            }
          : EMPTY,
      );
    }
  }, [open, editing, reset]);

  function submit(values: OfferFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Teklifi Düzenle" : "Yeni Teklif"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <ScrollArea className="h-[55vh] pr-4">
            <div className="flex flex-col gap-4 py-1">
              <TextField label="Teklif Başlığı" registration={register("title")} error={errors.title?.message} />
              <SelectField
                label="Hizmet Türü"
                name="serviceType"
                control={control}
                options={SERVICE_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
                error={errors.serviceType?.message}
              />
              <TextareaField label="Açıklama" registration={register("description")} />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <FormSectionTitle>Kalemler</FormSectionTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", unitPrice: 0, quantity: 1 })}
                  >
                    <Plus className="size-3.5" />
                    Kalem Ekle
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 p-2 sm:grid-cols-[1fr_100px_80px_auto] sm:items-end sm:border-0 sm:p-0"
                  >
                    <TextField
                      label="Açıklama"
                      className="col-span-2 sm:col-span-1"
                      registration={register(`items.${index}.description` as const)}
                      error={errors.items?.[index]?.description?.message}
                    />
                    <CurrencyField
                      label="Birim Fiyat"
                      name={`items.${index}.unitPrice` as const}
                      control={control}
                      error={errors.items?.[index]?.unitPrice?.message}
                    />
                    <TextField
                      label="Adet"
                      type="number"
                      registration={register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                      error={errors.items?.[index]?.quantity?.message}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="col-span-2 justify-self-end sm:col-span-1 sm:justify-self-auto"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label="KDV (%)"
                  type="number"
                  registration={register("vatRate", { valueAsNumber: true })}
                  error={errors.vatRate?.message}
                />
                <TextField
                  label="Geçerlilik Tarihi"
                  type="date"
                  registration={register("validUntil")}
                  error={errors.validUntil?.message}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Ara Toplam: {formatCurrency(subtotal)}</span>
                <span className="font-semibold">Toplam (KDV Dahil): {formatCurrency(total)}</span>
              </div>

              <TextareaField label="Notlar" registration={register("notes")} />

              <div className="flex flex-col gap-1.5">
                <Label>Teklif Kabul Belgesi (opsiyonel)</Label>
                {fileName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{fileName}</span>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={handleRemoveFile} aria-label="Belgeyi kaldır">
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("w-fit", uploadingFile && "opacity-60")}
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {uploadingFile ? "Yükleniyor…" : "PDF / Word Yükle"}
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Müşteri portalında Hizmet Belgeleri altında &quot;Teklif Kabul&quot; olarak gösterilir.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
