"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField, CurrencyField } from "@/components/crm/form-fields";
import { formatCurrency } from "@/components/crm/crm-format";
import { PAYMENT_METHOD_OPTIONS } from "@/components/finance/finance-labels";
import { collectPaymentFormSchema, type CollectPaymentFormValues } from "@/lib/validations/finance";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/mock/crm";
import type { PaymentMethod } from "@/lib/mock/finance";

interface CollectPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  currentBalance: number;
  onSubmit: (values: CollectPaymentFormValues) => void;
}

export function CollectPaymentForm({ open, onOpenChange, customer, currentBalance, onSubmit }: CollectPaymentFormProps) {
  const empty: CollectPaymentFormValues = {
    customerId: customer?.id ?? "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    method: "nakit",
    description: "",
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CollectPaymentFormValues>({
    resolver: zodResolver(collectPaymentFormSchema),
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) reset(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.id]);

  function submit(values: CollectPaymentFormValues) {
    onSubmit({ ...values, customerId: customer?.id ?? values.customerId });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4.5 text-primary" />
            Tahsilat Al
          </DialogTitle>
          <DialogDescription>{customer?.companyName ?? "Müşteri"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="rounded-xl bg-destructive/5 px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Mevcut Bakiye</p>
            <p className="text-xl font-bold text-destructive tabular-nums">{formatCurrency(currentBalance)}</p>
          </div>

          <CurrencyField
            label="Tutar (₺)"
            name="amount"
            control={control}
            required
            placeholder="0"
            error={errors.amount?.message}
          />

          <TextField
            label="Tarih"
            type="date"
            required
            registration={register("date")}
            error={errors.date?.message}
          />

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-foreground/80">Ödeme Yöntemi</p>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value as PaymentMethod)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
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

          <TextareaField
            label="Açıklama"
            placeholder="Açıklama (opsiyonel)"
            rows={2}
            registration={register("description")}
            error={errors.description?.message}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <CreditCard className="size-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
