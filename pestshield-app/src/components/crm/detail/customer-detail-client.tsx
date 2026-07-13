"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDetailPage } from "@/components/crm/detail/customer-detail-page";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { loadCustomers } from "@/lib/customer-store";
import { customers as seedCustomers, type Customer } from "@/lib/mock/crm";

interface CustomerDetailClientProps {
  id: string;
  initialTab: string;
}

/**
 * Sunucu tarafında (statik tohum veride) bulunamayan müşteriler için son çare —
 * gerçek bir backend olmadığından yeni oluşturulan müşteriler yalnızca
 * tarayıcının localStorage'ında yaşar. Bu bileşen istemci tarafında oradan
 * tekrar arar; yine bulunamazsa gerçekten var olmayan bir kayıt demektir.
 */
export function CustomerDetailClient({ id, initialTab }: CustomerDetailClientProps) {
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);

  useEffect(() => {
    const found = loadCustomers(seedCustomers).find((c) => c.id === id) ?? null;
    setCustomer(found);
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
