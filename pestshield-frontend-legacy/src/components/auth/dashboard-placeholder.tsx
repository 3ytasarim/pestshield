"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

interface DashboardPlaceholderProps {
  roleLabel: string;
}

/**
 * Bu turda sadece login/signup akışının uçtan uca çalıştığını (rol bazlı
 * yönlendirme dahil) doğrulamak için minimal bir yer tutucu. Gerçek
 * dashboard içeriği ayrı bir iş kalemidir.
 */
export function DashboardPlaceholder({ roleLabel }: DashboardPlaceholderProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <ShieldCheck className="size-10 text-emerald-600" />
      <h1 className="text-2xl font-semibold">Hoş geldiniz, {roleLabel}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Bu, rol bazlı yönlendirmenin çalıştığını doğrulayan bir yer
        tutucu sayfadır. Gerçek dashboard içeriği ayrıca geliştirilecektir.
      </p>
      <Button variant="outline" onClick={handleLogout}>
        Çıkış Yap
      </Button>
    </div>
  );
}
