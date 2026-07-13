"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/crm/form-fields";
import { customers, getLocations } from "@/lib/mock/crm";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import { stationFormSchema, type StationFormValues } from "@/lib/validations/operations";

const CUSTOMER_OPTIONS = customers.map((c) => ({ value: c.id, label: c.companyName }));
const TYPE_OPTIONS = Object.entries(STATION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY: StationFormValues = {
  customerId: "",
  locationId: "",
  label: "",
  type: "rodent_bait",
};

interface StationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StationFormValues) => void;
  defaultCustomerId?: string;
}

export function StationForm({ open, onOpenChange, onSubmit, defaultCustomerId }: StationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: { ...EMPTY, customerId: defaultCustomerId ?? "" },
  });

  useEffect(() => {
    if (open) reset({ ...EMPTY, customerId: defaultCustomerId ?? "" });
  }, [open, defaultCustomerId, reset]);

  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const locationOptions = useMemo(() => {
    if (!selectedCustomerId) return [];
    return getLocations(selectedCustomerId).map((l) => ({ value: l.id, label: l.name }));
  }, [selectedCustomerId]);

  function submit(values: StationFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinned className="size-4.5 text-primary" />
            Yeni İstasyon Ekle
          </DialogTitle>
          <DialogDescription>Bir müşteri lokasyonuna yeni tuzak/yem istasyonu ekleyin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <SelectField label="Müşteri" name="customerId" control={control} options={CUSTOMER_OPTIONS} required error={errors.customerId?.message} />
          <SelectField
            label="Lokasyon"
            name="locationId"
            control={control}
            options={locationOptions}
            required
            placeholder={selectedCustomerId ? "Lokasyon seçiniz" : "Önce müşteri seçiniz"}
            error={errors.locationId?.message}
          />
          <TextField label="İstasyon Adı" placeholder="Depo — İstasyon 4" required registration={register("label")} error={errors.label?.message} />
          <SelectField label="İstasyon Tipi" name="type" control={control} options={TYPE_OPTIONS} required error={errors.type?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <MapPinned className="size-4" />
              İstasyonu Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
