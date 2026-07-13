"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import {
  inviteEmployeeSchema,
  type InviteEmployeeFormValues,
} from "@/lib/validations/auth";

interface Employee {
  id: string;
  email: string;
  fullName: string | null;
  isCompanyOwner: boolean;
  isActive: boolean;
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeFormValues>({ resolver: zodResolver(inviteEmployeeSchema) });

  const loadEmployees = useCallback(() => {
    apiClient
      .get<Employee[]>("/companies/me/employees")
      .then(({ data }) => setEmployees(data));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  async function onSubmit(values: InviteEmployeeFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.post("/companies/me/employees", values);
      toast.success("Çalışan hesabı oluşturuldu");
      reset();
      loadEmployees();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Çalışan eklenemedi")
          : "Bir şeyler ters gitti, lütfen tekrar deneyin";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <Link
        href="/dashboard/client"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Panele dön
      </Link>

      <h1 className="text-xl font-semibold">Ekibim</h1>

      <div className="rounded-lg border border-border bg-card p-5">
        <ul className="flex flex-col divide-y divide-border">
          {employees.map((employee) => (
            <li key={employee.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{employee.fullName ?? employee.email}</p>
                <p className="text-muted-foreground">{employee.email}</p>
              </div>
              {employee.isCompanyOwner && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Sahip
                </span>
              )}
            </li>
          ))}
          {employees.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Henüz çalışan yok</li>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="size-5 text-muted-foreground" />
          <h2 className="font-medium">Yeni Çalışan Ekle</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input id="fullName" aria-invalid={!!errors.fullName} {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Geçici Şifre</Label>
            <Input
              id="password"
              type="password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="h-10 w-full">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Çalışan Ekle
          </Button>
        </form>
      </div>
    </div>
  );
}
