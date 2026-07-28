"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OfferStatusBadge } from "@/components/crm/crm-badges";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { Offer } from "@/lib/mock/crm";

function isPdf(fileName: string | null): boolean {
  return (fileName ?? "").toLowerCase().endsWith(".pdf");
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function CustomerPortalOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOffer, setViewOffer] = useState<Offer | null>(null);

  useEffect(() => {
    fetch("/api/portal/offers")
      .then((res) => (res.ok ? res.json() : { offers: [] }))
      .then((data: { offers?: Offer[] }) => setOffers(data.offers ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Teklifler</h1>
        <p className="text-sm text-muted-foreground">İlaçlama firmanızın hesabınıza sunduğu teklifler.</p>
      </div>

      {!loading && offers.length === 0 ? (
        <EmptyState icon={FileText} title="Henüz teklif yok" description="İlaçlama firmanız bir teklif oluşturduğunda burada görünür." />
      ) : (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Teklif Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{offers.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead className="hidden sm:table-cell">Geçerlilik Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-20 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer, i) => (
                  <TableRow key={offer.id}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{offer.offerNo}</TableCell>
                    <TableCell>{offer.title}</TableCell>
                    <TableCell>{formatCurrency(offer.amount, offer.currency)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(offer.validUntil)}</TableCell>
                    <TableCell>
                      <OfferStatusBadge status={offer.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {offer.fileDataUrl && (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" title="Görüntüle" onClick={() => setViewOffer(offer)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="İndir"
                            onClick={() => downloadDataUrl(offer.fileDataUrl!, offer.fileName || `${offer.offerNo}.pdf`)}
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewOffer} onOpenChange={(open) => !open && setViewOffer(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewOffer?.title}</DialogTitle>
          </DialogHeader>
          {viewOffer &&
            (isPdf(viewOffer.fileName) ? (
              <iframe src={viewOffer.fileDataUrl ?? ""} className="h-[70vh] w-full rounded-lg border border-border" title={viewOffer.title} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Bu dosya türü için tarayıcı içi önizleme desteklenmiyor.</p>
                <Button onClick={() => window.open(viewOffer.fileDataUrl ?? "", "_blank", "noopener,noreferrer")}>
                  <Eye className="size-4" />
                  Yeni Sekmede Aç
                </Button>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
