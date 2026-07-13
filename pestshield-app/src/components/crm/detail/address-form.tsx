"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, CheckboxField } from "@/components/crm/form-fields";
import { addressFormSchema, type AddressFormValues } from "@/lib/validations/crm";
import { ADDRESS_TYPE_LABELS } from "@/components/crm/crm-labels";

const EMPTY: AddressFormValues = {
  type: "billing",
  country: "Türkiye",
  city: "",
  district: "",
  neighborhood: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddressFormValues) => void;
  defaultValues?: AddressFormValues;
}

export function AddressForm({ open, onOpenChange, onSubmit, defaultValues }: AddressFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: AddressFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Adresi Düzenle" : "Yeni Adres Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Adres Tipi"
              name="type"
              control={control}
              className="sm:col-span-2"
              options={Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              error={errors.type?.message}
            />
            <TextField label="Ülke" registration={register("country")} error={errors.country?.message} />
            <TextField label="Şehir" registration={register("city")} error={errors.city?.message} />
            <TextField label="İlçe" registration={register("district")} error={errors.district?.message} />
            <TextField label="Mahalle" registration={register("neighborhood")} error={errors.neighborhood?.message} />
            <TextField label="Posta Kodu" registration={register("postalCode")} error={errors.postalCode?.message} />
            <TextField
              label="Açık Adres"
              className="sm:col-span-2"
              registration={register("addressLine")}
              error={errors.addressLine?.message}
            />
          </div>
          <CheckboxField label="Varsayılan adres mi?" name="isDefault" control={control} />
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
