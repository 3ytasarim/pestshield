"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import { stationFormSchema, type StationFormValues } from "@/lib/validations/operations";
import type { Station } from "@/lib/mock/operations";
import { LocationForm } from "@/components/crm/detail/location-form";
import type { LocationFormValues } from "@/lib/validations/crm";
import type { Branch, Location } from "@/lib/mock/crm";

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
  customers: { id: string; companyName: string }[];
  defaultCustomerId?: string;
  editing?: (Station & { customer?: { id: string; companyName: string } | null }) | null;
}

export function StationForm({ open, onOpenChange, onSubmit, customers, defaultCustomerId, editing }: StationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: { ...EMPTY, customerId: defaultCustomerId ?? "" },
  });

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.companyName }));

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { customerId: editing.customerId, locationId: editing.locationId, label: editing.label, type: editing.type }
          : { ...EMPTY, customerId: defaultCustomerId ?? "" },
      );
    }
  }, [open, editing, defaultCustomerId, reset]);

  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [locationFormOpen, setLocationFormOpen] = useState(false);

  function refetchLocations(customerId: string) {
    return fetch(`/api/crm/locations?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        const options = data.locations.map((l: { id: string; name: string }) => ({ value: l.id, label: l.name }));
        setLocationOptions(options);
        return options;
      })
      .catch(() => {
        setLocationOptions([]);
        return [];
      });
  }

  useEffect(() => {
    if (!selectedCustomerId) {
      setLocationOptions([]);
      setBranchOptions([]);
      return;
    }
    refetchLocations(selectedCustomerId);
    fetch(`/api/crm/branches?customerId=${selectedCustomerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { branches: Branch[] } | null) => setBranchOptions((data?.branches ?? []).map((b) => b.name)))
      .catch(() => setBranchOptions([]));
  }, [selectedCustomerId]);

  async function handleLocationSubmit(values: LocationFormValues) {
    if (!selectedCustomerId) return;
    const res = await fetch("/api/crm/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId: selectedCustomerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Lokasyon oluşturulamadı");
      return;
    }
    const location = data.location as Location;
    await refetchLocations(selectedCustomerId);
    setValue("locationId", location.id, { shouldValidate: true });
    toast.success("Lokasyon eklendi");
  }

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
            {editing ? "İstasyonu Düzenle" : "Yeni İstasyon Ekle"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "İstasyon bilgilerini güncelleyin." : "Bir müşteri lokasyonuna yeni tuzak/yem istasyonu ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <SelectField label="Müşteri" name="customerId" control={control} options={customerOptions} required error={errors.customerId?.message} />
          <div className="flex flex-col gap-1.5">
            <SelectField
              label="Lokasyon"
              name="locationId"
              control={control}
              options={locationOptions}
              required
              placeholder={selectedCustomerId ? "Lokasyon seçiniz" : "Önce müşteri seçiniz"}
              error={errors.locationId?.message}
            />
            {selectedCustomerId ? (
              <button
                type="button"
                onClick={() => setLocationFormOpen(true)}
                className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="size-3" />
                {locationOptions.length === 0 ? "Bu müşteriye henüz lokasyon yok — yeni lokasyon ekle" : "Yeni lokasyon ekle"}
              </button>
            ) : null}
          </div>
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

      <LocationForm
        open={locationFormOpen}
        onOpenChange={setLocationFormOpen}
        onSubmit={handleLocationSubmit}
        branchOptions={branchOptions}
      />
    </Dialog>
  );
}
