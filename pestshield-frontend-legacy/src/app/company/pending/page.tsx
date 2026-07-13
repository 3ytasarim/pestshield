"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hourglass, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import type { ClientCompanyStatus } from "@/lib/auth/role-redirect";

export default function CompanyPendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ClientCompanyStatus | null>(null);

  useEffect(() => {
    apiClient
      .get<{ status: ClientCompanyStatus }>("/companies/me")
      .then(({ data }) => setStatus(data.status))
      .catch(() => setStatus(null));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isSuspended = status === "suspended";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {isSuspended ? (
        <ShieldAlert className="size-10 text-destructive" />
      ) : (
        <Hourglass className="size-10 text-amber-500" />
      )}
      <h1 className="text-2xl font-semibold">
        {isSuspended ? "Firma hesabınız askıya alındı" : "Onay bekleniyor"}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isSuspended
          ? "Hesabınızla ilgili bir sorun var. Detaylar için Pak İş ile iletişime geçin."
          : "Firmanız Pak İş tarafından incelemeye alındı. Onaylandığında bu ekran otomatik olarak lisans aktivasyonuna yönlendirecek - lütfen daha sonra tekrar giriş yapın."}
      </p>
      <Button variant="outline" onClick={handleLogout}>
        Çıkış Yap
      </Button>
    </div>
  );
}
