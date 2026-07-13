"use client";

import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/landing/motion/counter";
import { ParallaxElement } from "@/components/landing/motion/parallax-element";

// app.pestshield.com ayrı bir proje (pestshield-app) olduğu için
// cross-origin link kullanılır - Next.js <Link> yerine düz <a>.
const APP_LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

const STATS = [
  { value: 500, suffix: "+", label: "Saha Kontrolü" },
  { value: 50, suffix: "+", label: "Firma" },
  { value: 99, suffix: "%", label: "Denetim Uyumu" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* Arkaplan: parallax nokta deseni + gradient glow */}
      <ParallaxElement speed={0.15} className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </ParallaxElement>
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm"
        >
          <ShieldCheck className="size-4 text-emerald-600" />
          BRCGS &amp; HACCP Uyumlu Dijital Kalkan
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Zararlı Kontrolünde{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Denetime Her An Hazır Olun
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Saha personeliniz QR kod okutarak veri girer, siz gerçek zamanlı
          trend, uygunsuzluk ve denetim raporlarını tek platformda izlersiniz.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 px-6 text-base"
            nativeButton={false}
            render={<a href={APP_LOGIN_URL} />}
          >
            Firmanızı Kaydedin <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base"
            nativeButton={false}
            render={<a href="#dashboard" />}
          >
            <PlayCircle className="size-4" /> Nasıl Çalışır?
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <Counter
                value={stat.value}
                suffix={stat.suffix}
                className="text-3xl font-bold sm:text-4xl"
              />
              <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
