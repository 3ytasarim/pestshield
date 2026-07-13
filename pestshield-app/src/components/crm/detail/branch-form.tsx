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
import { TextField, SelectField } from "@/components/crm/form-fields";
import { branchFormSchema, type BranchFormValues } from "@/lib/validations/crm";
import { CITY_OPTIONS } from "@/components/crm/crm-labels";

const EMPTY: BranchFormValues = {
  name: "",
  code: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  addressLine: "",
  serviceStatus: "active",
  riskLevel: "low",
};

interface BranchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BranchFormValues) => void;
  defaultValues?: BranchFormValues;
}

export function BranchForm({ open, onOpenChange, onSubmit, defaultValues }: BranchFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({ resolver: zodResolver(branchFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: BranchFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Şubeyi Düzenle" : "Yeni Şube Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Şube Adı" registration={register("name")} error={errors.name?.message} />
            <TextField label="Şube Kodu" registration={register("code")} error={errors.code?.message} />
            <TextField
              label="Yetkili Kişi"
              registration={register("contactName")}
              error={errors.contactName?.message}
            />
            <TextField label="Telefon" registration={register("phone")} error={errors.phone?.message} />
            <TextField label="E-posta" type="email" registration={register("email")} error={errors.email?.message} />
            <SelectField
              label="Şehir"
              name="city"
              control={control}
              options={CITY_OPTIONS.map((c) => ({ value: c, label: c }))}
              error={errors.city?.message}
            />
            <TextField label="İlçe" registration={register("district")} error={errors.district?.message} />
            <SelectField
              label="Hizmet Durumu"
              name="serviceStatus"
              control={control}
              options={[
                { value: "active", label: "Aktif" },
                { value: "passive", label: "Pasif" },
              ]}
              error={errors.serviceStatus?.message}
            />
            <SelectField
              label="Risk Seviyesi"
              name="riskLevel"
              control={control}
              options={[
                { value: "low", label: "Düşük" },
                { value: "medium", label: "Orta" },
                { value: "high", label: "Yüksek" },
                { value: "critical", label: "Kritik" },
              ]}
              error={errors.riskLevel?.message}
            />
            <TextField
              label="Açık Adres"
              className="sm:col-span-2"
              registration={register("addressLine")}
              error={errors.addressLine?.message}
            />
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
