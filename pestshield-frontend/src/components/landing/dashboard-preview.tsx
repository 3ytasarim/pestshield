"use client";

import { ShieldCheck, Building2, Users } from "lucide-react";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";

export function DashboardPreview() {
  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-6 py-24">
      <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tüm verileriniz tek bir ekranda
        </h2>
        <p className="mt-4 text-muted-foreground">
          Firmalar, cihazlar ve kontrol geçmişi — PestShield yönetim
          panelinden anlık görünür.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Tarayıcı çerçevesi */}
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-yellow-400" />
            <span className="size-2.5 rounded-full bg-green-400" />
            <span className="ml-3 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
              app.pestshield.com/dashboard/admin
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
            {[
              { icon: Building2, label: "Toplam Firma", value: "48" },
              { icon: Users, label: "Toplam Kullanıcı", value: "312" },
              { icon: ShieldCheck, label: "Aktif Cihaz", value: "1.204" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border p-4">
                <stat.icon className="size-4 text-muted-foreground" />
                <div className="mt-2 text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 text-sm font-medium">Aylık Kontrol Trendi</div>
              <div className="flex h-32 items-end gap-2">
                {[40, 65, 45, 80, 60, 95, 70].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-600/20 to-emerald-500"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
