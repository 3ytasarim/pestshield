"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/auth/icon-input";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Geçersiz veya eksik bağlantı");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...values }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message ?? "Şifre güncellenemedi");
        return;
      }
      toast.success("Şifreniz güncellendi, giriş yapabilirsiniz");
      router.push("/login");
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="text-center text-sm text-destructive">
        Geçersiz veya eksik sıfırlama bağlantısı.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <IconInput
        icon={Lock}
        type="password"
        placeholder="Yeni Şifre"
        autoComplete="new-password"
        aria-invalid={!!errors.password}
        {...register("password")}
      />
      {errors.password && <p className="px-4 text-xs text-destructive">{errors.password.message}</p>}

      <IconInput
        icon={Lock}
        type="password"
        placeholder="Yeni Şifre (Tekrar)"
        autoComplete="new-password"
        aria-invalid={!!errors.confirmPassword}
        {...register("confirmPassword")}
      />
      {errors.confirmPassword && (
        <p className="px-4 text-xs text-destructive">{errors.confirmPassword.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 rounded-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Şifreyi Güncelle
      </Button>
    </form>
  );
}
