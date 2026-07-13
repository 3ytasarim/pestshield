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
import { TextField, TextareaField, CheckboxField } from "@/components/crm/form-fields";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/crm";

const EMPTY: ContactFormValues = {
  name: "",
  title: "",
  department: "",
  phone: "",
  email: "",
  note: "",
  isPrimary: false,
};

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContactFormValues) => void;
  defaultValues?: ContactFormValues;
}

export function ContactForm({ open, onOpenChange, onSubmit, defaultValues }: ContactFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema), defaultValues: defaultValues ?? EMPTY });

  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY);
  }, [open, defaultValues, reset]);

  function submit(values: ContactFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Kişiyi Düzenle" : "Yeni İletişim Kişisi"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Ad Soyad" className="sm:col-span-2" registration={register("name")} error={errors.name?.message} />
            <TextField label="Ünvan" registration={register("title")} error={errors.title?.message} />
            <TextField label="Departman" registration={register("department")} error={errors.department?.message} />
            <TextField label="Telefon" registration={register("phone")} error={errors.phone?.message} />
            <TextField label="E-posta" type="email" registration={register("email")} error={errors.email?.message} />
            <TextareaField label="Not" className="sm:col-span-2" registration={register("note")} />
          </div>
          <CheckboxField label="Birincil iletişim kişisi mi?" name="isPrimary" control={control} />
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
