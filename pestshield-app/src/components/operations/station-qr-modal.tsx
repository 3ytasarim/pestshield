"use client";

import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCodeImage } from "@/components/operations/qr-code-image";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import type { Station } from "@/lib/mock/operations";
import type { Customer } from "@/lib/mock/crm";

interface StationQrModalProps {
  station: (Station & { customer?: Pick<Customer, "companyName"> | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function stationQrValue(station: Station): string {
  if (typeof window === "undefined") return station.qrCode;
  return `${window.location.origin}/dashboard/tech/scan?code=${station.qrCode}`;
}

export function StationQrModal({ station, open, onOpenChange }: StationQrModalProps) {
  if (!station) return null;

  async function printLabel() {
    if (!station) return;
    const dataUrl = await QRCode.toDataURL(stationQrValue(station), { width: 320, margin: 1, color: { dark: "#0f2942", light: "#ffffff" } });
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${station.qrCode}</title>
      <style>
        body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
        .label{border:1px dashed #94a3b8;border-radius:12px;padding:20px;text-align:center;width:220px;}
        .label img{width:160px;height:160px;}
        .label p.title{font-weight:700;font-size:13px;margin:8px 0 2px;}
        .label p.code{font-family:monospace;font-size:11px;color:#64748b;margin:0;}
      </style></head>
      <body>
        <div class="label">
          <img src="${dataUrl}" alt="QR" />
          <p class="title">${station.label}</p>
          <p class="code">${station.qrCode}</p>
        </div>
        <script>window.print();</script>
      </body></html>`;
    win.document.write(html);
    win.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{station.label}</DialogTitle>
          <DialogDescription>
            {station.customer?.companyName ?? "—"} · {STATION_TYPE_LABELS[station.type]}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <QrCodeImage value={stationQrValue(station)} size={200} />
          <p className="font-mono text-sm text-muted-foreground">{station.qrCode}</p>
          <p className="text-center text-xs text-muted-foreground">
            Bu etiketi istasyonun üzerine yapıştırın. Teknisyenler servis sırasında bu kodu okutarak kontrol kaydı oluşturur.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button onClick={printLabel}>Etiketi Yazdır</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
