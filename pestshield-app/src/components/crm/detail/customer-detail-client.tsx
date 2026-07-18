"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDetailPage } from "@/components/crm/detail/customer-detail-page";
import { EmptyState } from "@/components/crm/detail/empty-state";
import type { Customer } from "@/lib/mock/crm";

interface CustomerDetailClientProps {
  id: string;
  initialTab: string;
}

/**
 * Sunucu tarafında (statik tohum veride) bulunamayan müşteriler için son çare —
 * gerçekten firmanın kendi oluşturduğu (veritabanında yaşayan) bir müşteri
 * olabilir; istemci tarafında API'den tekrar dener, yine bulunamazsa
 * gerçekten var olmayan bir kayıt demektir.
 */
export function CustomerDetailClient({ id, initialTab }: CustomerDetailClientProps) {
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/crm/customers/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer: Customer } | null) => setCustomer(data?.customer ?? null))
      .catch(() => setCustomer(null));
  }, [id]);

  if (customer === undefined) return null;

  if (!customer) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Müşteri bulunamadı"
        description="Bu müşteri kaydı bulunamadı veya silinmiş olabilir."
        action={
          <Button nativeButton={false} render={<Link href="/dashboard/client/customers" />}>
            Müşteri Listesine Dön
          </Button>
        }
      />
    );
  }

  return <CustomerDetailPage customer={customer} initialTab={initialTab} />;
}
