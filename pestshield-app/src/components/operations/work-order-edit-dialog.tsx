"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock } from "lucide-react";
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
import { TextField, SelectField } from "@/components/crm/form-fields";
import { SERVICE_TYPE_OPTIONS } from "@/components/crm/crm-labels";
import type { WorkOrder, WorkOrderStatus } from "@/lib/mock/crm";

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "planned", label: "Planlandı" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "delayed", label: "Gecikti" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal" },
];

const editSchema = z.object({
  technicianId: z.string().min(1, "Teknisyen seçiniz"),
  serviceType: z.string().min(1, "Hizmet türü seçiniz"),
  plannedDate: z.string().min(1, "Planlanan tarih zorunludur"),
  status: z.enum(["planned", "in_progress", "completed", "delayed", "cancelled"]),
});

type EditValues = z.infer<typeof editSchema>;

interface WorkOrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: (WorkOrder & { customer?: { companyName: string } | null }) | null;
  technicians: { id: string; name: string }[];
  onSaved: (updated: WorkOrder) => void;
}

export function WorkOrderEditDialog({ open, onOpenChange, order, technicians, onSaved }: WorkOrderEditDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (!open || !order) return;
    const currentTechnicianId = technicians.find((t) => t.name === order.technician)?.id ?? "";
    reset({
      technicianId: currentTechnicianId,
      serviceType: order.serviceType,
      plannedDate: order.plannedDate,
      status: order.status,
    });
  }, [open, order, technicians, reset]);

  const technicianOptions = technicians.map((t) => ({ value: t.id, label: t.name }));
  const serviceTypeOptions = SERVICE_TYPE_OPTIONS.map((s) => ({ value: s, label: s }));

  async function submit(values: EditValues) {
    if (!order) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/work-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "İş emri güncellenemedi");
        return;
      }
      toast.success("İş emri güncellendi");
      onSaved(data.workOrder);
      onOpenChange(false);
    } catch {
      toast.error("İş emri güncellenemedi — sunucuya ulaşılamadı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4.5 text-primary" />
            Planlamayı Düzenle
          </DialogTitle>
          <DialogDescription>{order?.customer?.companyName ?? "Servis"} için teknisyen, tarih, hizmet türü veya durumu güncelleyin.</DialogDescription>
        </DialogHeader>

        {order && (
          <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
            <SelectField label="Teknisyen" name="technicianId" control={control} options={technicianOptions} error={errors.technicianId?.message} />
            <SelectField label="Hizmet Türü" name="serviceType" control={control} options={serviceTypeOptions} error={errors.serviceType?.message} />
            <TextField label="Planlanan Tarih" type="date" required registration={register("plannedDate")} error={errors.plannedDate?.message} />
            <SelectField label="Durum" name="status" control={control} options={STATUS_OPTIONS} error={errors.status?.message} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" loading={submitting}>
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
