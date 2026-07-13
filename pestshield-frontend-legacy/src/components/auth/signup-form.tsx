"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setIsSubmitting(true);
    try {
      // Firma kaydı backend üzerinden yapılır (bkz. POST /companies/register):
      // firma satırı + Supabase Auth kullanıcısı (role=client, company_id,
      // isCompanyOwner=true) tek işlemde, service_role ile oluşturulur.
      await apiClient.post("/companies/register", {
        companyName: values.companyName,
        contactEmail: values.contactEmail,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      setRegistered(true);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Kayıt oluşturulamadı")
          : "Bir şeyler ters gitti, lütfen tekrar deneyin";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 p-6 text-center">
        <MailCheck className="size-8 text-emerald-600" />
        <p className="font-medium text-foreground">Kaydınız alındı</p>
        <p className="text-sm text-muted-foreground">
          Firmanız Pak İş tarafından onaylandığında giriş yapıp lisans
          anahtarınızı aktive edebileceksiniz.
        </p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Giriş sayfasına dön
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">Firma Adı</Label>
        <Input
          id="companyName"
          autoComplete="organization"
          placeholder="ABC Liman İşletmeleri A.Ş."
          aria-invalid={!!errors.companyName}
          {...register("companyName")}
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contactEmail">Firma İletişim E-postası</Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="info@firma.com"
          aria-invalid={!!errors.contactEmail}
          {...register("contactEmail")}
        />
        <p className="text-xs text-muted-foreground">Lisans anahtarları bu adrese gönderilir</p>
        {errors.contactEmail && (
          <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Yetkili Ad Soyad</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Ayşe Yılmaz"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Giriş E-postası</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@sirket.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Şifre (Tekrar)</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 h-10 w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Firma Kaydı Oluştur
      </Button>
    </form>
  );
}
