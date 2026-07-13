"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface QrCodeImageProps {
  value: string;
  size?: number;
  className?: string;
}

/** `qrcode` kütüphanesiyle gerçek, taranabilir bir QR kod üretir (client-side, API key gerektirmez). */
export function QrCodeImage({ value, size = 160, className }: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#0f2942", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className={cn("animate-pulse rounded-lg bg-muted", className)} style={{ width: size, height: size }} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt={`QR kod — ${value}`} width={size} height={size} className={cn("rounded-lg", className)} />;
}
