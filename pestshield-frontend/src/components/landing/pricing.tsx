"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { TiltCard } from "@/components/landing/motion/tilt-card";

// app.pestshield.com ayrı bir proje (pestshield-app) olduğu için
// cross-origin link kullanılır - Next.js <Link> yerine düz <a>.
const APP_LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

const PLANS = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    period: "5 gün demo",
    description: "Küçük ekipler için deneme amaçlı",
    features: ["1 firma hesabı", "Sınırsız cihaz kaydı", "QR kod ile kontrol", "E-posta desteği"],
    highlighted: false,
  },
  {
    name: "Profesyonel",
    price: "Aylık",
    period: "lisans anahtarı ile",
    description: "Büyüyen operasyonlar için",
    features: [
      "Sınırsız çalışan",
      "Gerçek zamanlı trend analizi",
      "BRCGS/HACCP raporlama",
      "Öncelikli destek",
    ],
    highlighted: true,
  },
  {
    name: "Kurumsal",
    price: "Yıllık",
    period: "özel fiyatlandırma",
    description: "Çoklu lokasyon ve büyük filolar için",
    features: [
      "Profesyonel'deki her şey",
      "Özel entegrasyonlar",
      "AI risk öngörüsü",
      "Özel hesap yöneticisi",
    ],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="paketler" className="mx-auto max-w-6xl px-6 py-24">
      <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Firmanıza uygun paketi seçin
        </h2>
        <p className="mt-4 text-muted-foreground">
          5 günlük demo ile başlayın, ihtiyacınıza göre lisansınızı yükseltin.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan, index) => (
          <ScrollReveal key={plan.name} delay={index * 0.1}>
            <TiltCard
              className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-emerald-600 bg-card shadow-lg"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-6 bg-emerald-600 text-white">
                  En Popüler
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={plan.highlighted ? "default" : "outline"}
                nativeButton={false}
                render={<a href={APP_LOGIN_URL} />}
              >
                Firmanızı Kaydedin
              </Button>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
