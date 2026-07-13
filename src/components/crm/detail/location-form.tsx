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
import { TextField, TextareaField, SelectField, CheckboxField } from "@/components/crm/form-fields";
import { locationFormSchema, type LocationFormValues } from "@/lib/validations/crm";
import { LOCATION_TYPE_LABELS } from "@/components/crm/crm-labels";

const EMPTY: LocationFormValues = {
  name: "",
  type: "production_area",
  branchName: "",
  description: "",
  riskLevel: "low",
  isIndoor: true,
};

interface LocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LocationFormValues) => void;
  branchOptions: string[];
  defaultValues?: LocationFormValues;
}

export function LocationForm({ open, onOpenChange, onSubmit, branchOptions, defaultValues }: LocationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>({ resolver: zodResolver(locationFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: LocationFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Lokasyonu Düzenle" : "Yeni Lokasyon Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Lokasyon Adı" className="sm:col-span-2" registration={register("name")} error={errors.name?.message} />
            <SelectField
              label="Lokasyon Tipi"
              name="type"
              control={control}
              options={Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              error={errors.type?.message}
            />
            <SelectField
              label="Bağlı Şube"
              name="branchName"
              control={control}
              options={branchOptions.map((b) => ({ value: b, label: b }))}
              error={errors.branchName?.message}
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
            <TextareaField label="Açıklama" className="sm:col-span-2" registration={register("description")} />
          </div>
          <CheckboxField label="İç Alan (işaretli değilse Dış Alan)" name="isIndoor" control={control} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">Fotoğraf Yükleme</Label>
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:bg-muted/50">
                <Upload className="size-4" />
                Fotoğraf seç (mock)
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <div>
              <Label className="mb-1.5">Kroki Yükleme</Label>
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground hover:bg-muted/50">
                <Upload className="size-4" />
                Kroki seç (mock)
                <input type="file" className="hidden" accept="image/*,application/pdf" />
              </label>
            </div>
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
