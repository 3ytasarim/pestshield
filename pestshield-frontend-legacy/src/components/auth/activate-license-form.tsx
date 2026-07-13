"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Loader2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import {
  activateLicenseSchema,
  type ActivateLicenseFormValues,
} from "@/lib/validations/auth";

export function ActivateLicenseForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateLicenseFormValues>({
    resolver: zodResolver(activateLicenseSchema),
  });

  async function onSubmit(values: ActivateLicenseFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.post("/licenses/activate", values);
      toast.success("Lisansınız aktive edildi, yönlendiriliyorsunuz…");
      router.push("/dashboard/client");
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Lisans aktive edilemedi")
          : "Bir şeyler ters gitti, lütfen tekrar deneyin";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <KeyRound className="size-6" />
        </span>
        <h1 className="text-xl font-semibold">Lisansınızı aktive edin</h1>
        <p className="text-sm text-muted-foreground">
          Firmanıza tanımlanan lisans anahtarını aşağıya girin. Demo lisanslar
          5 gün, satın alınan lisanslar aylık/yıllık süreyle aktive edilir.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="key">Lisans Anahtarı</Label>
          <Input
            id="key"
            placeholder="PSHLD-XXXXXX-XXXXXX"
            className="text-center font-mono uppercase tracking-wider"
            aria-invalid={!!errors.key}
            {...register("key")}
          />
          {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-10 w-full">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Aktive Et
        </Button>
      </form>
    </div>
  );
}
