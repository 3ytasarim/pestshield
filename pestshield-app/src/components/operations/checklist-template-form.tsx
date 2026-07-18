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
import { TextField, TextareaField } from "@/components/crm/form-fields";
import { checklistTemplateFormSchema, type ChecklistTemplateFormValues } from "@/lib/validations/operations";

const EMPTY: ChecklistTemplateFormValues = {
  title: "",
  category: "",
  description: "",
  frequency: "",
};

interface ChecklistTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChecklistTemplateFormValues) => void;
}

export function ChecklistTemplateForm({ open, onOpenChange, onSubmit }: ChecklistTemplateFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChecklistTemplateFormValues>({ resolver: zodResolver(checklistTemplateFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  function submit(values: ChecklistTemplateFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-4.5 text-primary" />
            Yeni Kontrol Maddesi Ekle
          </DialogTitle>
          <DialogDescription>Kontrol noktaları kütüphanesine yeni bir madde ekleyin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <TextField label="Başlık" required registration={register("title")} error={errors.title?.message} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Kategori" required registration={register("category")} error={errors.category?.message} />
            <TextField label="Periyot" required registration={register("frequency")} error={errors.frequency?.message} />
          </div>
          <TextareaField label="Açıklama" registration={register("description")} error={errors.description?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <ClipboardList className="size-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
