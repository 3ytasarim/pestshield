// Kroki kat planı görselini, üzerine yerleştirilmiş numaralı istasyon
// işaretleriyle birlikte tek bir PNG'ye birleştirir (rapor/yazdırma için).

import { stationColor, numberStations } from "@/components/crm/kroki-constants";
import type { KrokiSketch } from "@/lib/mock/crm";

export function compositeKrokiImage(sketch: KrokiSketch): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context oluşturulamadı"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const numbering = numberStations(sketch.stations);
      sketch.stations.forEach((station) => {
        if (sketch.layerVisibility[station.type] === false) return;
        const size = Math.max(sketch.stationSize, 22);
        const cx = (station.x / 100) * img.naturalWidth;
        const cy = (station.y / 100) * img.naturalHeight;
        ctx.fillStyle = stationColor(station.type);
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.stroke();
        const num = numbering.get(station.id);
        if (num) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${Math.round(size * 0.5)}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(num), cx, cy + 1);
        }
      });
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Kroki görseli yüklenemedi"));
    img.src = sketch.imageDataUrl;
  });
}
