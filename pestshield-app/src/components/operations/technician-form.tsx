"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HardHat } from "lucide-react";
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
import { technicianFormSchema, technicianEditFormSchema, type TechnicianFormValues } from "@/lib/validations/operations";
import type { Technician } from "@/lib/mock/operations";

const EMPTY: TechnicianFormValues = {
  name: "",
  phone: "",
  email: "",
  password: "",
  licenseNumber: "",
  licenseExpiry: new Date().toISOString().slice(0, 10),
  status: "active",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "on_leave", label: "İzinli" },
  { value: "inactive", label: "Pasif" },
];

interface TechnicianFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TechnicianFormValues) => void;
  editing?: Technician | null;
}

export function TechnicianForm({ open, onOpenChange, onSubmit, editing }: TechnicianFormProps) {
  const isEditing = !!editing;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TechnicianFormValues>({
    resolver: zodResolver(isEditing ? technicianEditFormSchema : technicianFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            phone: editing.phone,
            email: editing.email,
            password: "",
            licenseNumber: editing.licenseNumber,
            licenseExpiry: editing.licenseExpiry,
            status: editing.status,
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  function submit(values: TechnicianFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="size-4.5 text-primary" />
            {isEditing ? "Teknisyeni Düzenle" : "Yeni Teknisyen Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Teknisyenin bilgilerini, durumunu veya şifresini güncelleyin." : "Saha ekibine yeni bir teknisyen ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <TextField label="Ad Soyad" required registration={register("name")} error={errors.name?.message} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Telefon" required registration={register("phone")} error={errors.phone?.message} />
            <TextField label="E-posta" type="email" required registration={register("email")} error={errors.email?.message} />
          </div>
          <div>
            <TextField
              label={isEditing ? "Yeni Şifre (opsiyonel)" : "Şifre"}
              type="password"
              required={!isEditing}
              registration={register("password")}
              error={errors.password?.message}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {isEditing ? "Boş bırakılırsa şifre değişmez." : "Teknisyen bu e-posta ve şifreyle mobil panele giriş yapabilecek."}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField label="Ehliyet No" required registration={register("licenseNumber")} error={errors.licenseNumber?.message} />
            <TextField label="Geçerlilik Tarihi" type="date" required registration={register("licenseExpiry")} error={errors.licenseExpiry?.message} />
          </div>
          <div>
            <SelectField label="Durum" name="status" control={control} options={STATUS_OPTIONS} error={errors.status?.message} />
            {isEditing && <p className="mt-1 text-xs text-muted-foreground">&quot;Pasif&quot; seçilirse teknisyen mobil panele giriş yapamaz.</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <HardHat className="size-4" />
              {isEditing ? "Değişiklikleri Kaydet" : "Teknisyeni Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
