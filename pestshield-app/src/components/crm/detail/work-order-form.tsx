"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";
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
import { SERVICE_TYPE_OPTIONS } from "@/components/crm/crm-labels";
import { technicians } from "@/lib/mock/operations";
import { workOrderFormSchema, type WorkOrderFormValues } from "@/lib/validations/crm";

const EMPTY: WorkOrderFormValues = {
  serviceType: SERVICE_TYPE_OPTIONS[0],
  technician: "",
  plannedDate: new Date().toISOString().slice(0, 10),
};

const SERVICE_TYPE_SELECT_OPTIONS = SERVICE_TYPE_OPTIONS.map((v) => ({ value: v, label: v }));
const TECHNICIAN_OPTIONS = technicians.filter((t) => t.status === "active").map((t) => ({ value: t.name, label: t.name }));

interface WorkOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WorkOrderFormValues) => void;
}

export function WorkOrderForm({ open, onOpenChange, onSubmit }: WorkOrderFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderFormValues>({ resolver: zodResolver(workOrderFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: WorkOrderFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-4.5 text-primary" />
            Yeni İş Emri
          </DialogTitle>
          <DialogDescription>Bu müşteri için yeni bir servis iş emri oluşturun.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <SelectField label="Hizmet Türü" name="serviceType" control={control} options={SERVICE_TYPE_SELECT_OPTIONS} required error={errors.serviceType?.message} />
          <SelectField label="Teknisyen" name="technician" control={control} options={TECHNICIAN_OPTIONS} required placeholder="Teknisyen seçiniz" error={errors.technician?.message} />
          <TextField label="Planlanan Tarih" type="date" required registration={register("plannedDate")} error={errors.plannedDate?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <ClipboardList className="size-4" />
              İş Emrini Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
