"use client";

import { motion } from "framer-motion";
import { PestIcon } from "@/components/pest-management/pest-icon";
import type { PestIconKey } from "@/lib/mock/pest-management";

interface FloatingPest {
  icon: PestIconKey;
  leftPercent: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Deterministik konfigürasyon (Math.random KULLANILMAZ — SSR/CSR hydration uyumsuzluğunu önler).
// Delay'ler duration'a göre kısa tutulur ki her an ekranda birden fazla ikon birden görünür olsun.
const FLOATERS: FloatingPest[] = [
  { icon: "roach", leftPercent: 4, size: 76, duration: 20, delay: 0, opacity: 0.22 },
  { icon: "ant", leftPercent: 14, size: 58, duration: 17, delay: 1.6, opacity: 0.24 },
  { icon: "spider", leftPercent: 24, size: 70, duration: 23, delay: 3.2, opacity: 0.2 },
  { icon: "fly", leftPercent: 34, size: 52, duration: 15, delay: 0.8, opacity: 0.24 },
  { icon: "rodent", leftPercent: 44, size: 88, duration: 25, delay: 4.8, opacity: 0.18 },
  { icon: "mosquito", leftPercent: 54, size: 48, duration: 14, delay: 2.4, opacity: 0.24 },
  { icon: "wasp", leftPercent: 64, size: 60, duration: 18, delay: 5.6, opacity: 0.22 },
  { icon: "beetle", leftPercent: 74, size: 66, duration: 21, delay: 1.2, opacity: 0.2 },
  { icon: "roach", leftPercent: 84, size: 54, duration: 16, delay: 3.6, opacity: 0.22 },
  { icon: "ant", leftPercent: 92, size: 46, duration: 13, delay: 6.4, opacity: 0.2 },
  { icon: "spider", leftPercent: 9, size: 50, duration: 19, delay: 8, opacity: 0.18 },
  { icon: "beetle", leftPercent: 30, size: 62, duration: 22, delay: 7.2, opacity: 0.2 },
  { icon: "fly", leftPercent: 58, size: 44, duration: 14.5, delay: 9.6, opacity: 0.22 },
  { icon: "rodent", leftPercent: 78, size: 80, duration: 24, delay: 10.4, opacity: 0.17 },
];

/**
 * Genel Bakış sayfasında, mevcut kartların ARKASINDA (z-0) sürekli döngüyle
 * alttan yukarı süzülüp kaybolan, düşük opasiteli dekoratif böcek ikonları.
 * `public/pests/{key}.png` eklendiğinde gerçek görseller kullanılır; eklenmediyse
 * PestIcon bileşeni sessizce lucide Bug ikonuna düşer (kırık görsel göstermez).
 */
export function PestBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {FLOATERS.map((f, i) => (
        <motion.div
          key={i}
          className="absolute text-foreground"
          style={{ left: `${f.leftPercent}%`, width: f.size, height: f.size, opacity: f.opacity }}
          initial={{ y: "110vh", rotate: -8 }}
          animate={{ y: "-15vh", rotate: 8 }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: "linear" }}
        >
          <PestIcon icon={f.icon} className="size-full" />
        </motion.div>
      ))}
    </div>
  );
}
