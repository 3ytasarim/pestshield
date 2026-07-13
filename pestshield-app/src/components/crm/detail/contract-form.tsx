"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextField, TextareaField, SelectField, CurrencyField } from "@/components/crm/form-fields";
import { contractFormSchema, type ContractFormValues } from "@/lib/validations/crm";
import { SERVICE_TYPE_OPTIONS, SERVICE_PERIOD_OPTIONS, CURRENCY_OPTIONS } from "@/components/crm/crm-labels";

const EMPTY: ContractFormValues = {
  contractNo: "",
  serviceType: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  servicePeriod: "",
  monthlyAmount: 0,
  currency: "TRY",
  description: "",
};

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContractFormValues) => void;
  defaultValues?: ContractFormValues;
}

export function ContractForm({ open, onOpenChange, onSubmit, defaultValues }: ContractFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContractFormValues>({ resolver: zodResolver(contractFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: ContractFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Sözleşme</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Sözleşme No" registration={register("contractNo")} error={errors.contractNo?.message} />
            <SelectField
              label="Hizmet Türü"
              name="serviceType"
              control={control}
              options={SERVICE_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
              error={errors.serviceType?.message}
            />
            <TextField label="Başlangıç Tarihi" type="date" registration={register("startDate")} error={errors.startDate?.message} />
            <TextField label="Bitiş Tarihi" type="date" registration={register("endDate")} error={errors.endDate?.message} />
            <SelectField
              label="Periyot"
              name="servicePeriod"
              control={control}
              options={SERVICE_PERIOD_OPTIONS.map((v) => ({ value: v, label: v }))}
              error={errors.servicePeriod?.message}
            />
            <CurrencyField
              label="Aylık Tutar"
              name="monthlyAmount"
              control={control}
              error={errors.monthlyAmount?.message}
            />
            <SelectField
              label="Para Birimi"
              name="currency"
              control={control}
              options={CURRENCY_OPTIONS.map((v) => ({ value: v, label: v }))}
              error={errors.currency?.message}
            />
          </div>
          <TextareaField label="Açıklama" registration={register("description")} />
          <div>
            <Label className="mb-1.5">Dosya Yükleme</Label>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:bg-muted/50">
              <Upload className="size-4" />
              PDF seç (mock)
              <input type="file" className="hidden" accept="application/pdf" />
            </label>
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
