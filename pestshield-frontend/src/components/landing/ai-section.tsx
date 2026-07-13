"use client";

import { Sparkles, Brain, LineChart } from "lucide-react";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { TiltCard } from "@/components/landing/motion/tilt-card";

const AI_POINTS = [
  {
    icon: Brain,
    title: "Risk Öngörüsü",
    description:
      "Geçmiş kontrol verilerinden öğrenerek hangi bölgelerin risk altında olduğunu önceden işaret eder.",
  },
  {
    icon: LineChart,
    title: "Akıllı Trend Yorumlama",
    description:
      "Aktivite grafiklerindeki anormal artışları otomatik tespit edip ekibinize özetler.",
  },
  {
    icon: Sparkles,
    title: "Öneri Motoru",
    description:
      "Kontrol sonuçlarına göre düzeltici faaliyet önerileri sunar, denetim hazırlığını hızlandırır.",
  },
];

export function AiSection() {
  return (
    <section id="ai" className="relative overflow-hidden bg-muted/30 py-24">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-emerald-600" />
            Yapay Zeka Destekli
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Veriniz sadece kayıt değil, öngörü olsun
          </h2>
          <p className="mt-4 text-muted-foreground">
            PestShield&apos;in AI katmanı, sahadan gelen her veriyi anlamlı
            aksiyonlara dönüştürür.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {AI_POINTS.map((point, index) => (
            <ScrollReveal key={point.title} delay={index * 0.1}>
              <TiltCard className="h-full rounded-2xl border border-border bg-card p-6">
                <point.icon className="size-8 text-emerald-600" />
                <h3 className="mt-4 text-lg font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{point.description}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
