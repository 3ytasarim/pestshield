"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Repeat,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OfferStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { OfferForm } from "@/components/crm/detail/offer-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { printOffer, downloadOfferDocx } from "@/components/crm/detail/print-offer";
import type { Customer, Offer } from "@/lib/mock/crm";
import type { OfferFormValues } from "@/lib/validations/crm";

export function OffersTab({ customerId, customer }: { customerId: string; customer: Customer }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleUpdate(values: OfferFormValues) {
    if (!editingOffer) return;
    const res = await fetch(`/api/crm/offers/${editingOffer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Teklif güncellenemedi");
      return;
    }
    setOffers((prev) => prev.map((o) => (o.id === editingOffer.id ? data.offer : o)));
    toast.success("Teklif güncellendi");
    setEditingOffer(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/offers/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Teklif silinemedi");
        return;
      }
      setOffers((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      toast.success("Teklif silindi");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
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
                        <DropdownMenuItem
                          onClick={() => {
                            if (!customer) return;
                            downloadOfferDocx(customer, offer).catch((error) =>
                              toast.error(error instanceof Error ? error.message : "Word şablonu indirilemedi"),
                            );
                          }}
                        >
                          <Download className="size-3.5" />
                          Word Şablonundan İndir (.docx)
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
                        <DropdownMenuItem onClick={() => setEditingOffer(offer)}>
                          <Pencil className="size-3.5" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(offer)}>
                          <Trash2 className="size-3.5" />
                          Sil
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
      <OfferForm
        open={!!editingOffer}
        onOpenChange={(open) => !open && setEditingOffer(null)}
        onSubmit={handleUpdate}
        editing={editingOffer}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teklifi sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.offerNo}&quot; teklifini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={handleDelete}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
