"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  qrDataUrl,
  printQrLabel,
  printApplicationCertificate,
  printHygienePoster,
  type DocumentCustomer,
  type DocumentBranding,
} from "@/lib/pdf/customer-documents";

export function QrCodeCard() {
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [customer, setCustomer] = useState<DocumentCustomer | null>(null);
  const [branding, setBranding] = useState<DocumentBranding | null>(null);

  useEffect(() => {
    fetch("/api/portal/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { customer?: DocumentCustomer; branding?: DocumentBranding } | null) => {
        if (!data?.customer) return;
        setCustomer(data.customer);
        setBranding(data.branding ?? null);
        setQr(await qrDataUrl(data.customer, 260));
      })
      .finally(() => setLoading(false));
  }, []);

  const links = customer
    ? [
        { label: "QR Kod Etiketi indir", onClick: () => printQrLabel(customer, branding ?? undefined) },
        { label: "Ürün uygulama belgesi indir", onClick: () => printApplicationCertificate(customer, branding ?? undefined) },
        { label: "Müşteri hijyen takip sistemi afişi indir", onClick: () => printHygienePoster(customer, branding ?? undefined) },
      ]
    : [];

  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-4">
        <h2 className="w-full text-sm font-semibold tracking-wide text-muted-foreground uppercase">Uygulama QR Kodu</h2>
        {!loading && qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Uygulama QR Kodu" className="size-48 rounded-lg" />
        )}
        <div className="flex w-full flex-col gap-1.5">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={link.onClick}
              className="flex items-center gap-1.5 text-left text-xs font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
            >
              <Download className="size-3.5 shrink-0" />
              {link.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
