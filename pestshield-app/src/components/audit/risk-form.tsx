"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
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
import { RISK_CATEGORY_OPTIONS } from "@/components/audit/audit-labels";
import { riskFormSchema, type RiskFormValues } from "@/lib/validations/audit";
import { cn } from "@/lib/utils";

const EMPTY: RiskFormValues = {
  title: "",
  category: "operational",
  description: "",
  likelihood: 3,
  impact: 3,
  mitigation: "",
  owner: "",
  customerId: "none",
};

const SCALE = [1, 2, 3, 4, 5];

interface RiskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RiskFormValues) => void;
  customers: { id: string; companyName: string }[];
}

export function RiskForm({ open, onOpenChange, onSubmit, customers }: RiskFormProps) {
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
  } = useForm<RiskFormValues>({ resolver: zodResolver(riskFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: RiskFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4.5 text-primary" />
            Yeni Risk Ekle
          </DialogTitle>
          <DialogDescription>Risk kaydını oluşturun ve olasılık/etki değerlendirmesi yapın.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <TextField label="Başlık" required registration={register("title")} error={errors.title?.message} />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SelectField label="Kategori" name="category" control={control} options={RISK_CATEGORY_OPTIONS} error={errors.category?.message} />
            <SelectField label="Müşteri" name="customerId" control={control} options={CUSTOMER_OPTIONS} error={errors.customerId?.message} />
          </div>

          <TextareaField label="Açıklama" rows={2} required registration={register("description")} error={errors.description?.message} />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-foreground/80">Olasılık (1-5)</p>
              <Controller
                control={control}
                name="likelihood"
                render={({ field }) => (
                  <div className="grid grid-cols-5 gap-1.5">
                    {SCALE.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(n)}
                        className={cn(
                          "rounded-xl border py-2 text-sm font-semibold transition-colors",
                          field.value === n ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-foreground/80">Etki (1-5)</p>
              <Controller
                control={control}
                name="impact"
                render={({ field }) => (
                  <div className="grid grid-cols-5 gap-1.5">
                    {SCALE.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(n)}
                        className={cn(
                          "rounded-xl border py-2 text-sm font-semibold transition-colors",
                          field.value === n ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <TextareaField label="Önlem / Aksiyon Planı" rows={2} required registration={register("mitigation")} error={errors.mitigation?.message} />
          <TextField label="Sorumlu Kişi" required registration={register("owner")} error={errors.owner?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <ShieldAlert className="size-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
