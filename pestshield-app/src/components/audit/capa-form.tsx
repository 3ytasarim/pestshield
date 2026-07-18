"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField, SelectField } from "@/components/crm/form-fields";
import { CAPA_SEVERITY_OPTIONS, CAPA_SOURCE_OPTIONS } from "@/components/audit/audit-labels";
import { STANDARD_LABELS, type CapaSeverity } from "@/lib/mock/audit";
import { capaFormSchema, type CapaFormValues } from "@/lib/validations/audit";
import { cn } from "@/lib/utils";

const EMPTY: CapaFormValues = {
  title: "",
  standard: "none",
  customerId: "none",
  source: "internal_audit",
  severity: "medium",
  rootCause: "",
  actionPlan: "",
  responsible: "",
  dueDate: new Date().toISOString().slice(0, 10),
};

const STANDARD_OPTIONS = [
  { value: "none", label: "Genel (standarda bağlı değil)" },
  { value: "haccp", label: STANDARD_LABELS.haccp },
  { value: "brcgs", label: STANDARD_LABELS.brcgs },
  { value: "iso22000", label: STANDARD_LABELS.iso22000 },
  { value: "fssc", label: STANDARD_LABELS.fssc },
];

interface CapaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CapaFormValues) => void;
  customers: { id: string; companyName: string }[];
}

export function CapaForm({ open, onOpenChange, onSubmit, customers }: CapaFormProps) {
  const CUSTOMER_OPTIONS = [
    { value: "none", label: "Genel (müşteriye bağlı değil)" },
    ...customers.map((c) => ({ value: c.id, label: c.companyName })),
  ];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CapaFormValues>({ resolver: zodResolver(capaFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: CapaFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4.5 text-primary" />
            Yeni Düzeltici Faaliyet
          </DialogTitle>
          <DialogDescription>Bir uygunsuzluk veya bulgu için düzeltici faaliyet kaydı oluşturun.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <TextField label="Başlık" required registration={register("title")} error={errors.title?.message} />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SelectField label="İlgili Standart" name="standard" control={control} options={STANDARD_OPTIONS} error={errors.standard?.message} />
            <SelectField label="Müşteri" name="customerId" control={control} options={CUSTOMER_OPTIONS} error={errors.customerId?.message} />
          </div>

          <SelectField label="Kaynak" name="source" control={control} options={CAPA_SOURCE_OPTIONS} error={errors.source?.message} />

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-foreground/80">Önem Derecesi</p>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-1.5">
                  {CAPA_SEVERITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value as CapaSeverity)}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
                        field.value === option.value
                          ? "border-primary/30 bg-primary/10 text-primary"
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

          <TextareaField label="Kök Neden" rows={2} required registration={register("rootCause")} error={errors.rootCause?.message} />
          <TextareaField label="Aksiyon Planı" rows={2} required registration={register("actionPlan")} error={errors.actionPlan?.message} />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Sorumlu Kişi" required registration={register("responsible")} error={errors.responsible?.message} />
            <TextField label="Vade Tarihi" type="date" required registration={register("dueDate")} error={errors.dueDate?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <ClipboardCheck className="size-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
