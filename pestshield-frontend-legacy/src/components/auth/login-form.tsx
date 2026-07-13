"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import {
  getClientDestination,
  getDashboardPathForRole,
  type ClientCompanySummary,
  type LicenseSummary,
  type UserRole,
} from "@/lib/auth/role-redirect";

function mapSupabaseError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "E-posta adresinizi henüz doğrulamadınız";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error(mapSupabaseError(error.message));
        return;
      }

      const { data: profile } = await apiClient.get<{ role: UserRole }>("/users/me");
      toast.success("Giriş başarılı, yönlendiriliyorsunuz…");

      if (profile.role !== "client") {
        router.push(getDashboardPathForRole(profile.role));
        return;
      }

      const [{ data: company }, { data: licenses }] = await Promise.all([
        apiClient.get<ClientCompanySummary>("/companies/me"),
        apiClient.get<LicenseSummary[]>("/licenses/me"),
      ]);
      router.push(getClientDestination(company, licenses));
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
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
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 h-10 w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Giriş Yap
      </Button>
    </form>
  );
}
