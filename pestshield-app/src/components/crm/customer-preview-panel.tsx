"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Mail,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerStatusBadge, RiskBadge, CustomerTypeBadge, PotentialBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { Customer } from "@/lib/mock/crm";

interface CustomerPreviewPanelProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkOrder: (customer: Customer) => void;
  onCreateOffer: (customer: Customer) => void;
  onCreateContract: (customer: Customer) => void;
  onViewAccount: (customer: Customer) => void;
}

export function CustomerPreviewPanel({
  customer,
  open,
  onOpenChange,
  onCreateWorkOrder,
  onCreateOffer,
  onCreateContract,
  onViewAccount,
}: CustomerPreviewPanelProps) {
  // Sheet kapanış animasyonu sırasında son müşteriyi ekranda tutmak için;
  // prop null olduğu anda içerik kaybolmasın diye ayrıca cache'liyoruz.
  const [cachedCustomer, setCachedCustomer] = useState<Customer | null>(customer);
  useEffect(() => {
    if (customer) setCachedCustomer(customer);
  }, [customer]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md data-[side=right]:w-full data-[side=right]:sm:max-w-[440px]">
        {cachedCustomer && (() => {
          const customer = cachedCustomer;
          return (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{customer.companyName}</SheetTitle>
              <SheetDescription>Müşteri önizlemesi</SheetDescription>
            </SheetHeader>

            <div className="relative flex items-start gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-6">
              <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm shadow-primary/30">
                <Building2 className="size-5.5 text-white" />
              </div>
              <div className="relative min-w-0">
                <p className="truncate text-lg font-semibold leading-tight">{customer.companyName}</p>
                <p className="text-sm text-muted-foreground">{customer.sector}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <CustomerTypeBadge type={customer.customerType} />
                  {customer.isPotential && <PotentialBadge />}
                  <CustomerStatusBadge status={customer.status} />
                  <RiskBadge level={customer.riskLevel} />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <Separator />

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-3.5" />
                  {customer.contactName} · {customer.contactTitle}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {customer.contactPhone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" />
                  {customer.contactEmail}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Bekleyen Tahsilat</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(customer.pendingCollection)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sözleşme Bitişi</p>
                  <p className="font-semibold">{formatDate(customer.contractEndDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Son Servis</p>
                  <p className="font-semibold">{formatDate(customer.lastServiceDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sonraki Servis</p>
                  <p className="font-semibold">{formatDate(customer.nextServiceDate)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => onCreateWorkOrder(customer)}>
                  <ClipboardList className="size-3.5" />
                  İş Emri
                </Button>
                <Button variant="outline" size="sm" onClick={() => onCreateOffer(customer)}>
                  <FileSpreadsheet className="size-3.5" />
                  Teklif
                </Button>
                <Button variant="outline" size="sm" onClick={() => onCreateContract(customer)}>
                  <FileText className="size-3.5" />
                  Sözleşme
                </Button>
                <Button variant="outline" size="sm" onClick={() => onViewAccount(customer)}>
                  <Wallet className="size-3.5" />
                  Cari Hesap
                </Button>
              </div>
            </div>

            <div className="border-t border-border/60 bg-card/60 px-6 py-4">
              <Button
                className="w-full"
                nativeButton={false}
                render={<Link href={`/dashboard/client/customers/${customer.id}`} />}
              >
                Tüm Detayları Gör
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
          );
        })()}
      </SheetContent>
    </Sheet>
  );
}
