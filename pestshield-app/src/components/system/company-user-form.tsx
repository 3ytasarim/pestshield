"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, ToggleField } from "@/components/crm/form-fields";
import type { CompanyRole } from "@/lib/system/serialize";

const formSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string(),
  roleId: z.string().min(1, "Rol seçiniz"),
  isActive: z.boolean(),
});

export type CompanyUserFormDialogValues = z.infer<typeof formSchema>;

const EMPTY: CompanyUserFormDialogValues = { name: "", email: "", password: "", roleId: "", isActive: true };

interface CompanyUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyUserFormDialogValues) => Promise<void> | void;
  roles: CompanyRole[];
  editing?: { name: string; email: string; roleId: string; isActive: boolean } | null;
}

export function CompanyUserForm({ open, onOpenChange, onSubmit, roles, editing }: CompanyUserFormProps) {
  const isEditing = !!editing;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyUserFormDialogValues>({
    resolver: zodResolver(
      isEditing ? formSchema.extend({ password: z.union([z.string().min(8, "Şifre en az 8 karakter olmalıdır"), z.literal("")]) }) : formSchema.extend({ password: z.string().min(8, "Şifre en az 8 karakter olmalıdır") }),
    ),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(editing ? { ...editing, password: "" } : EMPTY);
    }
  }, [open, editing, reset]);

  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

  async function submit(values: CompanyUserFormDialogValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4.5 text-primary" />
            {isEditing ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Kullanıcının bilgilerini ve rolünü güncelleyin." : "Firmanıza yeni bir giriş hesabı ekleyin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <TextField label="Ad Soyad" required registration={register("name")} error={errors.name?.message} />
          <TextField label="E-posta" type="email" required registration={register("email")} error={errors.email?.message} />
          <div>
            <TextField
              label={isEditing ? "Yeni Şifre (opsiyonel)" : "Şifre"}
              type="password"
              required={!isEditing}
              registration={register("password")}
              error={errors.password?.message}
            />
            {isEditing && <p className="mt-1 text-xs text-muted-foreground">Boş bırakılırsa şifre değişmez.</p>}
          </div>
          {roleOptions.length > 0 ? (
            <SelectField label="Rol" name="roleId" control={control} options={roleOptions} error={errors.roleId?.message} required />
          ) : (
            <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Önce Roller sayfasından en az bir rol oluşturmalısınız.
            </p>
          )}
          {isEditing && <ToggleField label="Aktif" description="Kapatılırsa kullanıcı giriş yapamaz." name="isActive" control={control} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={roleOptions.length === 0}>
              <UserPlus className="size-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
