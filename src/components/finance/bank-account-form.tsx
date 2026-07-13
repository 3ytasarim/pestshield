"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";
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
import { bankAccountFormSchema, type BankAccountFormValues } from "@/lib/validations/finance";

const EMPTY: BankAccountFormValues = {
  bankName: "",
  accountName: "",
  iban: "",
  currency: "TRY",
  balance: 0,
};

interface BankAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BankAccountFormValues) => void;
}

export function BankAccountForm({ open, onOpenChange, onSubmit }: BankAccountFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankAccountFormValues>({ resolver: zodResolver(bankAccountFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: BankAccountFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="size-4.5 text-primary" />
            Yeni Banka Hesabı
          </DialogTitle>
          <DialogDescription>Şirket adına yeni bir banka hesabı ekleyin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <TextField label="Banka Adı" required placeholder="Türkiye İş Bankası" registration={register("bankName")} error={errors.bankName?.message} />
          <TextField label="Hesap Adı" required placeholder="Kurumsal Hesap" registration={register("accountName")} error={errors.accountName?.message} />
          <TextField label="IBAN" required placeholder="TR__ ____ ____ ____ ____ ____ __" registration={register("iban")} error={errors.iban?.message} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SelectField
              label="Para Birimi"
              name="currency"
              control={control}
              options={[
                { value: "TRY", label: "TRY" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
              error={errors.currency?.message}
            />
            <CurrencyField
              label="Başlangıç Bakiyesi"
              name="balance"
              control={control}
              placeholder="0"
              error={errors.balance?.message}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Landmark className="size-4" />
              Hesabı Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
