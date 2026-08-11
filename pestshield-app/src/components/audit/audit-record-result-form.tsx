"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/crm/form-fields";
import { auditRecordResultFormSchema, type AuditRecordResultFormValues } from "@/lib/validations/audit";
import type { AuditRecord } from "@/lib/mock/audit";

const RESULT_OPTIONS = [
  { value: "passed", label: "Başarılı" },
  { value: "passed_with_findings", label: "Bulgularla Başarılı" },
  { value: "failed", label: "Başarısız" },
];

interface AuditRecordResultFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AuditRecordResultFormValues) => void;
  audit: AuditRecord | null;
}

export function AuditRecordResultForm({ open, onOpenChange, onSubmit, audit }: AuditRecordResultFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuditRecordResultFormValues>({
    resolver: zodResolver(auditRecordResultFormSchema),
    defaultValues: { result: "passed", completedDate: new Date().toISOString().slice(0, 10), score: null },
  });

  useEffect(() => {
    if (open) reset({ result: "passed", completedDate: new Date().toISOString().slice(0, 10), score: null });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            Denetim Sonucu
          </DialogTitle>
          <DialogDescription>{audit ? `${audit.auditor} tarafından yapılan denetimin sonucunu kaydedin.` : ""}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <SelectField label="Sonuç" name="result" control={control} options={RESULT_OPTIONS} required />
          <TextField label="Tamamlanma Tarihi" type="date" registration={register("completedDate")} error={errors.completedDate?.message} required />
          <TextField
            label="Puan (opsiyonel)"
            type="number"
            registration={register("score", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            error={errors.score?.message}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
