"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/auth/icon-input";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      setDevResetLink(data.devResetLink ?? null);
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (devResetLink !== null) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-8 text-emerald-600" />
        <p className="text-sm text-muted-foreground">
          Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.
        </p>
        <a href={devResetLink} className="max-w-full truncate text-xs text-emerald-600 underline">
          (Geliştirme modu) Sıfırlama bağlantısı
        </a>
        <Link href="/login" className="mt-2 text-sm font-medium underline">
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <IconInput
          icon={Mail}
          type="email"
          placeholder="E-posta"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="px-4 text-xs text-destructive">{errors.email.message}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 rounded-full">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Sıfırlama Bağlantısı Gönder
        </Button>
      </form>
      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Giriş sayfasına dön
      </Link>
    </>
  );
}
