"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, CurrencyField } from "@/components/crm/form-fields";
import { invoiceFormSchema, type InvoiceFormValues } from "@/lib/validations/finance";

const EMPTY: InvoiceFormValues = {
  customerId: "",
  description: "",
  amount: 0,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
};

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvoiceFormValues) => void;
  customers: { id: string; companyName: string }[];
}

export function InvoiceForm({ open, onOpenChange, onSubmit, customers }: InvoiceFormProps) {
  const CUSTOMER_OPTIONS = customers.map((c) => ({ value: c.id, label: c.companyName }));
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({ resolver: zodResolver(invoiceFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: InvoiceFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4.5 text-primary" />
            Yeni Fatura
          </DialogTitle>
          <DialogDescription>Müşteriye yeni bir fatura kaydı oluşturun.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <SelectField label="Müşteri" name="customerId" control={control} options={CUSTOMER_OPTIONS} required error={errors.customerId?.message} />
          <TextField label="Açıklama" required registration={register("description")} error={errors.description?.message} />
          <CurrencyField
            label="Tutar (₺)"
            name="amount"
            control={control}
            required
            placeholder="0"
            error={errors.amount?.message}
          />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Düzenleme Tarihi" type="date" required registration={register("issueDate")} error={errors.issueDate?.message} />
            <TextField label="Vade Tarihi" type="date" required registration={register("dueDate")} error={errors.dueDate?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <FileText className="size-4" />
              Fatura Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
