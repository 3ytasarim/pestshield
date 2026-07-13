"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { TiltCard } from "@/components/landing/motion/tilt-card";

const TESTIMONIALS = [
  {
    name: "Operasyon Müdürü",
    company: "Liman İşletmesi",
    quote:
      "Denetim öncesi hazırlık süremiz günlerden saatlere düştü. Tüm kontrol geçmişi tek tıkla önümüzde.",
  },
  {
    name: "Kalite Sorumlusu",
    company: "Gıda Üretim Tesisi",
    quote:
      "Saha ekibimiz QR kod okutmayı çok kolay buldu. Kağıt takip dönemine artık dönmüyoruz.",
  },
  {
    name: "Genel Müdür",
    company: "İlaçlama Firması",
    quote:
      "Müşterilerimize sunduğumuz raporlama kalitesi PestShield sayesinde ciddi şekilde arttı.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Saha ekiplerinin ve yöneticilerin tercihi
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <ScrollReveal key={testimonial.name} delay={index * 0.1}>
              <TiltCard className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm text-muted-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
