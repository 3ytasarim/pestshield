"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/crm/form-fields";
import { vehicleFormSchema, type VehicleFormValues } from "@/lib/validations/operations";

const EMPTY: VehicleFormValues = {
  plate: "",
  brand: "",
  model: "",
  assignedTechnicianId: "none",
  registrationNumber: "",
  registrationExpiry: new Date().toISOString().slice(0, 10),
  inspectionDue: new Date().toISOString().slice(0, 10),
  insuranceDue: new Date().toISOString().slice(0, 10),
  status: "active",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "maintenance", label: "Bakımda" },
  { value: "inactive", label: "Pasif" },
];

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: VehicleFormValues) => void;
}

export function VehicleForm({ open, onOpenChange, onSubmit }: VehicleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleFormSchema), defaultValues: EMPTY });

  const [technicianOptions, setTechnicianOptions] = useState<{ value: string; label: string }[]>([{ value: "none", label: "Atanmadı" }]);

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/operations/technicians")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { technicians?: { id: string; name: string }[] } | null) => {
        setTechnicianOptions([
          { value: "none", label: "Atanmadı" },
          ...(data?.technicians ?? []).map((t) => ({ value: t.id, label: t.name })),
        ]);
      })
      .catch(() => setTechnicianOptions([{ value: "none", label: "Atanmadı" }]));
  }, [open]);

  function submit(values: VehicleFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="size-4.5 text-primary" />
            Yeni Araç Ekle
          </DialogTitle>
          <DialogDescription>Filoya yeni bir araç ekleyin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <TextField label="Plaka" placeholder="34 PS 999" required registration={register("plate")} error={errors.plate?.message} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Marka" required registration={register("brand")} error={errors.brand?.message} />
            <TextField label="Model" required registration={register("model")} error={errors.model?.message} />
          </div>
          <SelectField label="Atanan Teknisyen" name="assignedTechnicianId" control={control} options={technicianOptions} error={errors.assignedTechnicianId?.message} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Ruhsat No" required registration={register("registrationNumber")} error={errors.registrationNumber?.message} />
            <TextField label="Ruhsat Geçerlilik" type="date" required registration={register("registrationExpiry")} error={errors.registrationExpiry?.message} />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Muayene Tarihi" type="date" required registration={register("inspectionDue")} error={errors.inspectionDue?.message} />
            <TextField label="Sigorta Tarihi" type="date" required registration={register("insuranceDue")} error={errors.insuranceDue?.message} />
          </div>
          <SelectField label="Durum" name="status" control={control} options={STATUS_OPTIONS} error={errors.status?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Truck className="size-4" />
              Aracı Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
