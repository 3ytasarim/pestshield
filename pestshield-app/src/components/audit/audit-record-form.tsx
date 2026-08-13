"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/crm/form-fields";
import { STANDARD_LABELS, type AuditRecord, type ComplianceStandard } from "@/lib/mock/audit";
import { AUDIT_TYPE_LABELS } from "@/components/audit/audit-labels";
import { auditRecordFormSchema, type AuditRecordFormValues } from "@/lib/validations/audit";

const STANDARD_OPTIONS = (Object.keys(STANDARD_LABELS) as ComplianceStandard[]).map((value) => ({
  value,
  label: STANDARD_LABELS[value],
}));

const TYPE_OPTIONS = (Object.keys(AUDIT_TYPE_LABELS) as Array<keyof typeof AUDIT_TYPE_LABELS>).map((value) => ({
  value,
  label: AUDIT_TYPE_LABELS[value],
}));

const EMPTY: AuditRecordFormValues = {
  customerId: "",
  standard: "haccp",
  type: "external",
  auditor: "",
  scheduledDate: new Date().toISOString().slice(0, 10),
};

interface AuditRecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AuditRecordFormValues) => void;
  customers: { id: string; companyName: string }[];
  editing?: AuditRecord | null;
}

export function AuditRecordForm({ open, onOpenChange, onSubmit, customers, editing }: AuditRecordFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuditRecordFormValues>({
    resolver: zodResolver(auditRecordFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              customerId: editing.customerId,
              standard: editing.standard,
              type: editing.type,
              auditor: editing.auditor,
              scheduledDate: editing.scheduledDate,
            }
          : EMPTY,
      );
    }
  }, [open, editing, reset]);

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.companyName }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            {editing ? "Denetimi Düzenle" : "Denetim Planla"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Denetim planlama bilgilerini güncelleyin."
              : "HACCP/BRCGS gibi bir standart denetiminin tarihini önceden planlayın — bildirim merkezinde hatırlatma alırsınız."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <SelectField label="Müşteri" name="customerId" control={control} options={customerOptions} required error={errors.customerId?.message} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Standart" name="standard" control={control} options={STANDARD_OPTIONS} required />
            <SelectField label="Denetim Türü" name="type" control={control} options={TYPE_OPTIONS} required />
          </div>
          <TextField label="Denetçi / Kurum" registration={register("auditor")} error={errors.auditor?.message} required />
          <TextField label="Planlanan Tarih" type="date" registration={register("scheduledDate")} error={errors.scheduledDate?.message} required />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Kaydet" : "Planla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
