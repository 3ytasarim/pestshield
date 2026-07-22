"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
import { technicianFormSchema, technicianEditFormSchema, type TechnicianEditFormValues } from "@/lib/validations/operations";
import type { Technician } from "@/lib/mock/operations";

const EMPTY: TechnicianEditFormValues = {
  name: "",
  phone: "",
  email: "",
  password: "",
  licenseNumber: "",
  licenseExpiry: new Date().toISOString().slice(0, 10),
  status: "active",
  googleCalendarId: "none",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "on_leave", label: "İzinli" },
  { value: "inactive", label: "Pasif" },
];

interface TechnicianFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TechnicianEditFormValues) => void;
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
  } = useForm<TechnicianEditFormValues>({
    resolver: zodResolver(isEditing ? technicianEditFormSchema : technicianFormSchema) as Resolver<TechnicianEditFormValues>,
    defaultValues: EMPTY,
  });

  const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!open || !isEditing) return;
    fetch("/api/integrations/google-calendar/calendars")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { calendars?: { id: string; summary: string }[] } | null) => {
        setCalendarOptions((data?.calendars ?? []).map((c) => ({ value: c.id, label: c.summary })));
      })
      .catch(() => setCalendarOptions([]));
  }, [open, isEditing]);

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
            googleCalendarId: editing.googleCalendarId ?? "none",
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  function submit(values: TechnicianEditFormValues) {
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

          {isEditing && calendarOptions.length > 0 && (
            <div>
              <SelectField
                label="Google Takvimi (opsiyonel)"
                name="googleCalendarId"
                control={control}
                options={[{ value: "none", label: "Eşleştirilmedi" }, ...calendarOptions]}
                error={errors.googleCalendarId?.message}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Bu teknisyenin kişisel Google alt-takvimini seçin — o takvime eklenen randevular &quot;Bekleyen İçe Aktarımlar&quot;da bu teknisyene önerilir.
              </p>
            </div>
          )}

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
