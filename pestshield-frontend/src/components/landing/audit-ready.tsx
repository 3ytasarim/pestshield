"use client";

import { CheckCircle2, FileCheck2 } from "lucide-react";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { ParallaxElement } from "@/components/landing/motion/parallax-element";

const CHECKLIST = [
  "Zaman damgalı fotoğraf kanıtları",
  "Dijital imza ile doğrulanmış kontroller",
  "Tam denetim izi (audit trail) — hiçbir kayıt kaybolmaz",
  "Tek tıkla BRCGS/HACCP uyumlu PDF rapor",
  "Uygunsuzluk ve düzeltici faaliyet takibi",
];

export function AuditReady() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
            <FileCheck2 className="size-4 text-emerald-600" />
            Audit Ready
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Denetçi kapıda olduğunda paniğe gerek yok
          </h2>
          <p className="mt-4 text-muted-foreground">
            Her kontrol, her fotoğraf, her imza — sistemde eksiksiz ve
            değiştirilemez şekilde saklanır. Denetim günü tek tık uzağınızda.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ParallaxElement speed={0.2}>
          <ScrollReveal delay={0.15}>
            <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="font-semibold">Denetim Raporu</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Uyumlu
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {["Kemirgen İstasyonları", "EFT Cihazları", "Uygunsuzluk Takibi"].map(
                  (row) => (
                    <div key={row} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row}</span>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                  ),
                )}
              </div>
            </div>
          </ScrollReveal>
        </ParallaxElement>
      </div>
    </section>
  );
}
