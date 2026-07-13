"use client";

import { useEffect } from "react";
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
import { TextField, TextareaField, SelectField } from "@/components/crm/form-fields";
import { noteFormSchema, type NoteFormValues } from "@/lib/validations/crm";

const EMPTY: NoteFormValues = {
  title: "",
  content: "",
  priority: "normal",
  tags: "",
  reminderDate: "",
};

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NoteFormValues) => void;
  defaultValues?: NoteFormValues;
}

export function NoteForm({ open, onOpenChange, onSubmit, defaultValues }: NoteFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: NoteFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Notu Düzenle" : "Not Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <TextField label="Başlık" registration={register("title")} error={errors.title?.message} />
          <TextareaField label="Not" rows={4} registration={register("content")} error={errors.content?.message} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Öncelik"
              name="priority"
              control={control}
              options={[
                { value: "low", label: "Düşük" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "Yüksek" },
                { value: "critical", label: "Kritik" },
              ]}
              error={errors.priority?.message}
            />
            <TextField
              label="Hatırlatma Tarihi"
              type="date"
              registration={register("reminderDate")}
              error={errors.reminderDate?.message}
            />
          </div>
          <TextField
            label="Etiketler (virgülle ayırın)"
            registration={register("tags")}
            error={errors.tags?.message}
          />
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
