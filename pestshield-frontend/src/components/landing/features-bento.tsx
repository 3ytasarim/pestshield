"use client";

import {
  QrCode,
  ShieldCheck,
  TrendingUp,
  Users,
  Smartphone,
  BellRing,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { TiltCard } from "@/components/landing/motion/tilt-card";

const FEATURES = [
  {
    icon: QrCode,
    title: "QR Kod ile Anlık Kontrol",
    description:
      "Saha personeli cihazı QR kod ile okutur, kontrol geçmişini görür ve saniyeler içinde yeni kayıt girer.",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    icon: ShieldCheck,
    title: "BRCGS & HACCP Uyumlu",
    description: "Denetime hazır, standartlara uygun raporlama.",
    className: "",
  },
  {
    icon: TrendingUp,
    title: "Gerçek Zamanlı Trend",
    description: "Cihaz bazlı aktivite ve uygunsuzluk trend grafikleri.",
    className: "",
  },
  {
    icon: Users,
    title: "Ekip Yönetimi",
    description: "Firmanız kendi çalışanlarını ekleyip yetkilendirir.",
    className: "",
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu Saha Uygulaması",
    description:
      "Saha personeli için optimize edilmiş, tek elle kullanılabilen arayüz.",
    className: "md:col-span-2",
  },
  {
    icon: BellRing,
    title: "Otomatik Uygunsuzluk Uyarısı",
    description: "Riskli durumlar anında ilgili ekibe bildirilir.",
    className: "",
  },
];

export function FeaturesBento() {
  return (
    <section id="ozellikler" className="mx-auto max-w-6xl px-6 py-24">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tek platformda uçtan uca zararlı yönetimi
        </h2>
        <p className="mt-4 text-muted-foreground">
          Saha ekibinizden yönetim panelinize kadar her adım tasarlandı.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <ScrollReveal key={feature.title} delay={index * 0.08} className={feature.className}>
            <TiltCard className="h-full rounded-2xl border border-border bg-card p-6">
              <feature.icon className="size-8 text-emerald-600" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
