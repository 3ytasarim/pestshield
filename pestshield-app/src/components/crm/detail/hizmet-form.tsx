"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText as FileTextIcon, Plus, Trash2, Upload, UserRound, X } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextareaField, SelectField, CurrencyField, FieldWrapper, FormSectionTitle } from "@/components/crm/form-fields";
import { formatCurrency } from "@/components/crm/crm-format";
import { hizmetFormSchema, type HizmetFormValues } from "@/lib/validations/crm";
import { VAT_RATE_OPTIONS, WITHHOLDING_TAX_OPTIONS, withholdingFraction } from "@/components/crm/crm-labels";
import { technicians } from "@/lib/mock/operations";
import { readDocumentFile } from "@/lib/service-document-store";
import type { Customer } from "@/lib/mock/crm";

export interface ContractFileValue {
  fileDataUrl: string | null;
  fileName: string | null;
}

const TECHNICIAN_OPTIONS = technicians
  .filter((t) => t.status === "active")
  .map((t) => ({ value: t.name, label: t.name }));

function VatRateField({ name, control, label }: { name: `items.${number}.vatRate`; control: Control<HizmetFormValues>; label: string }) {
  return (
    <FieldWrapper label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
            <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
              <SelectValue>{`%${field.value}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {VAT_RATE_OPTIONS.map((v) => (
                <SelectItem key={v} value={String(v)}>
                  %{v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FieldWrapper>
  );
}

const EMPTY: HizmetFormValues = {
  description: "",
  contractStartDate: "",
  contractEndDate: "",
  assignedPersonnel: "",
  periodDays: 30,
  withholdingTax: "none",
  items: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 20 }],
};

interface HizmetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: HizmetFormValues, contract: ContractFileValue) => void;
  customer: Pick<Customer, "companyName"> | null;
  defaultValues?: HizmetFormValues;
  existingContract?: ContractFileValue;
}

export function HizmetForm({ open, onOpenChange, onSubmit, customer, defaultValues, existingContract }: HizmetFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HizmetFormValues>({ resolver: zodResolver(hizmetFormSchema), defaultValues: defaultValues ?? EMPTY });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });
  const withholdingTax = useWatch({ control, name: "withholdingTax" });

  const [contractFile, setContractFile] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContractFile(
        existingContract?.fileDataUrl && existingContract.fileName
          ? { dataUrl: existingContract.fileDataUrl, fileName: existingContract.fileName }
          : null,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleContractSelect(selected: File | undefined) {
    if (!selected) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      toast.error("Lütfen JPEG, JPG, PNG veya PDF dosyası seçin");
      return;
    }
    try {
      const dataUrl = await readDocumentFile(selected, 8);
      setContractFile({ dataUrl, fileName: selected.name });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
    }
  }

  const { subtotal, vatTotal, withholdingAmount, total } = useMemo(() => {
    const sub = (items ?? []).reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);
    const vat = (items ?? []).reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0) * ((item.vatRate || 0) / 100),
      0,
    );
    const withheld = vat * withholdingFraction(withholdingTax || "none");
    return { subtotal: sub, vatTotal: vat, withholdingAmount: withheld, total: sub + vat - withheld };
  }, [items, withholdingTax]);

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: HizmetFormValues) {
    onSubmit(values, { fileDataUrl: contractFile?.dataUrl ?? null, fileName: contractFile?.fileName ?? null });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Hizmeti Düzenle" : "Hizmet Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5">
              <UserRound className="size-3.5 text-muted-foreground" />
              Müşteri
            </Label>
            <div className="flex h-11 items-center rounded-xl border border-border/60 bg-muted/40 px-3.5 text-sm font-medium text-foreground">
              {customer?.companyName ?? "—"}
            </div>
          </div>

          <TextareaField label="Açıklama" registration={register("description")} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Sözleşme Başlangıç Tarihi" type="date" registration={register("contractStartDate")} error={errors.contractStartDate?.message} />
            <TextField label="Sözleşme Bitiş Tarihi" type="date" registration={register("contractEndDate")} error={errors.contractEndDate?.message} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="İlgili Personel"
              name="assignedPersonnel"
              control={control}
              options={TECHNICIAN_OPTIONS}
              placeholder="Saha teknisyeni seçin"
              error={errors.assignedPersonnel?.message}
            />
            <TextField
              label="Periyot (Gün)"
              type="number"
              registration={register("periodDays", { valueAsNumber: true })}
              error={errors.periodDays?.message}
            />
          </div>

          <div>
            <Label className="mb-1.5">Sözleşme Dosyası (*.PDF, *.JPG, *.PNG)</Label>
            {contractFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileTextIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{contractFile.fileName}</p>
                  <a href={contractFile.dataUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Görüntüle / İndir
                  </a>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setContractFile(null);
                    if (contractInputRef.current) contractInputRef.current.value = "";
                  }}
                  aria-label="Sözleşmeyi kaldır"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3.5 text-xs text-muted-foreground hover:bg-muted/50">
                <Upload className="size-3.5" />
                Dosya seç
                <input
                  ref={contractInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleContractSelect(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div>
            <Label className="mb-1.5">Excel Yükle (*.XLSX)</Label>
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3.5 text-xs text-muted-foreground hover:bg-muted/50">
              <Upload className="size-3.5" />
              Excel seç (mock)
              <input type="file" className="hidden" accept=".xlsx" />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FormSectionTitle>Hizmet Kalemleri</FormSectionTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 20 })}
              >
                <Plus className="size-3.5" />
                Kalem Ekle
              </Button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 p-2 sm:grid-cols-[1fr_80px_100px_90px_auto] sm:items-end sm:border-0 sm:p-0"
              >
                <TextField
                  label="Hizmet / Ürün"
                  className="col-span-2 sm:col-span-1"
                  registration={register(`items.${index}.description` as const)}
                  error={errors.items?.[index]?.description?.message}
                />
                <TextField
                  label="Miktar"
                  type="number"
                  registration={register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  error={errors.items?.[index]?.quantity?.message}
                />
                <CurrencyField
                  label="Birim Fiyat"
                  name={`items.${index}.unitPrice` as const}
                  control={control}
                  error={errors.items?.[index]?.unitPrice?.message}
                />
                <VatRateField label="KDV" name={`items.${index}.vatRate` as const} control={control} />
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

          <SelectField
            label="Tevkifat"
            name="withholdingTax"
            control={control}
            options={WITHHOLDING_TAX_OPTIONS}
            className="sm:max-w-xs"
          />

          <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Ara Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Toplam KDV</span>
              <span>{formatCurrency(vatTotal)}</span>
            </div>
            {withholdingAmount > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tevkifat ({WITHHOLDING_TAX_OPTIONS.find((o) => o.value === withholdingTax)?.label})</span>
                <span>-{formatCurrency(withholdingAmount)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1.5 font-semibold text-foreground">
              <span>Genel Toplam</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <DialogFooter>
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
