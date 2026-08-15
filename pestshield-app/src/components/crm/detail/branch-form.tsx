"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "@/components/ui/combobox";
import { TextField, SelectField, TextareaField } from "@/components/crm/form-fields";
import { branchFormSchema, type BranchFormValues } from "@/lib/validations/crm";
import { CITY_OPTIONS } from "@/components/crm/crm-labels";

interface CustomerLite {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  district: string;
  addressLine: string;
}

const EMPTY: BranchFormValues = {
  name: "",
  code: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  addressLine: "",
  description: "",
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
    setValue,
    formState: { errors },
  } = useForm<BranchFormValues>({ resolver: zodResolver(branchFormSchema), defaultValues: defaultValues ?? EMPTY });

  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [fillCustomerId, setFillCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? EMPTY);
      setFillCustomerId(null);
    }
  }, [open, defaultValues, reset]);

  useEffect(() => {
    if (!open || defaultValues) return;
    fetch("/api/crm/customers")
      .then((res) => (res.ok ? res.json() : { customers: [] }))
      .then((data: { customers: CustomerLite[] }) => setCustomers(data.customers ?? []))
      .catch(() => setCustomers([]));
  }, [open, defaultValues]);

  const customerItems = useMemo(() => customers.map((c) => ({ value: c.id, label: c.companyName })), [customers]);

  function handleFillFromCustomer(customerId: string | null) {
    setFillCustomerId(customerId);
    const source = customers.find((c) => c.id === customerId);
    if (!source) return;
    setValue("name", source.companyName, { shouldDirty: true });
    setValue("contactName", source.contactName, { shouldDirty: true });
    setValue("phone", source.contactPhone, { shouldDirty: true });
    setValue("email", source.contactEmail, { shouldDirty: true });
    setValue("city", source.city, { shouldDirty: true });
    setValue("district", source.district, { shouldDirty: true });
    setValue("addressLine", source.addressLine, { shouldDirty: true });
  }

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
          {!defaultValues && (
            <div>
              <Label className="mb-1.5">Müşteriden Doldur (opsiyonel)</Label>
              <Combobox
                items={customerItems}
                value={customerItems.find((c) => c.value === fillCustomerId) ?? null}
                onValueChange={(selected) => handleFillFromCustomer(selected?.value ?? null)}
              >
                <ComboboxInput placeholder="Müşteri ara…" />
                <ComboboxContent>
                  {(option: { value: string; label: string }) => (
                    <ComboboxItem key={option.value} value={option}>
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxContent>
              </Combobox>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Bir müşteri seçerseniz aşağıdaki alanlar o müşterinin bilgileriyle otomatik doldurulur, dilediğiniz gibi düzenleyebilirsiniz.
              </p>
            </div>
          )}
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
            <TextareaField
              label="Açıklama"
              className="sm:col-span-2"
              rows={2}
              placeholder="Bu şubeyle ilgili notlar (opsiyonel)"
              registration={register("description")}
              error={errors.description?.message}
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
