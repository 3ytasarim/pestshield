"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Plus,
  Send,
  Repeat,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OfferStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { OfferForm } from "@/components/crm/detail/offer-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { printOffer } from "@/components/crm/detail/print-offer";
import { getCustomerById, type Offer } from "@/lib/mock/crm";
import type { OfferFormValues } from "@/lib/validations/crm";

export function OffersTab({ customerId }: { customerId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const customer = getCustomerById(customerId);

  useEffect(() => {
    fetch(`/api/crm/offers?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setOffers(data.offers))
      .catch(() => toast.error("Teklifler yüklenemedi"));
  }, [customerId]);

  async function handleSubmit(values: OfferFormValues) {
    const res = await fetch("/api/crm/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId }),
    });
    if (!res.ok) {
      toast.error("Teklif oluşturulamadı");
      return;
    }
    const data = await res.json();
    setOffers((prev) => [data.offer, ...prev]);
  }

  async function updateStatus(offer: Offer, status: Offer["status"], message: string) {
    const res = await fetch(`/api/crm/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Durum güncellenemedi");
      return;
    }
    const data = await res.json();
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? data.offer : o)));
    toast.success(message);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teklifler</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Teklif
        </Button>
      </div>

      {offers.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="Henüz teklif yok" description="Yeni bir teklif oluşturun." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teklif No</TableHead>
                <TableHead className="hidden md:table-cell">Teklif Başlığı</TableHead>
                <TableHead className="hidden sm:table-cell">Tutar</TableHead>
                <TableHead className="hidden lg:table-cell">Geçerlilik Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden xl:table-cell">Oluşturulma Tarihi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.offerNo}</TableCell>
                  <TableCell className="hidden md:table-cell">{offer.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatCurrency(offer.amount, offer.currency)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(offer.validUntil)}</TableCell>
                  <TableCell>
                    <OfferStatusBadge status={offer.status} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{formatDate(offer.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => customer && printOffer(customer, offer)}>
                          <FileText className="size-3.5" />
                          PDF Oluştur
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(offer, "sent", "Teklif gönderildi")}>
                          <Send className="size-3.5" />
                          Gönder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(offer, "accepted", "Teklif kabul edildi")}>
                          <Check className="size-3.5" />
                          Kabul Et
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => updateStatus(offer, "rejected", "Teklif reddedildi")}
                        >
                          <X className="size-3.5" />
                          Reddet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Sözleşmeye dönüştürüldü")}>
                          <Repeat className="size-3.5" />
                          Sözleşmeye Dönüştür
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <OfferForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} />
    </div>
  );
}
