"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import type { LicenseSummary } from "@/lib/auth/role-redirect";

interface MeResponse {
  fullName: string | null;
  isCompanyOwner: boolean;
}

interface CompanyResponse {
  name: string;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [license, setLicense] = useState<LicenseSummary | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<MeResponse>("/users/me"),
      apiClient.get<CompanyResponse>("/companies/me"),
      apiClient.get<LicenseSummary[]>("/licenses/me"),
    ]).then(([meRes, companyRes, licensesRes]) => {
      setMe(meRes.data);
      setCompany(companyRes.data);
      const active = licensesRes.data.find((l) => l.status === "active") ?? null;
      setLicense(active);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-7 text-emerald-600" />
          <h1 className="text-xl font-semibold">{company?.name ?? "PestShield"}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" /> Çıkış Yap
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Hoş geldiniz, {me?.fullName ?? "Kullanıcı"}</p>
        {license && (
          <p className="mt-1 text-sm">
            Lisans:{" "}
            <span className="font-medium text-emerald-600">
              Aktif — {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString("tr-TR") : ""} tarihine kadar
            </span>
          </p>
        )}
      </div>

      {me?.isCompanyOwner && (
        <Link
          href="/dashboard/client/team"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50"
        >
          <Users className="size-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Ekibimi Yönet</p>
            <p className="text-sm text-muted-foreground">Firmanıza yeni çalışan ekleyin</p>
          </div>
        </Link>
      )}

      <p className="text-sm text-muted-foreground">
        Cihazlar ve kontrol geçmişi ekranları ayrı bir iş kalemi olarak
        geliştirilecektir.
      </p>
    </div>
  );
}
