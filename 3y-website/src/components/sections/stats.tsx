"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STATS = [
  { value: "50+",  label: "Tamamlanan Proje",     icon: "🏆" },
  { value: "3-4",  label: "Hafta Teslimat Süresi", icon: "⚡" },
  { value: "24/7", label: "Teknik Destek",          icon: "🛡️" },
  { value: "100%", label: "Müşteri Memnuniyeti",   icon: "⭐" },
];

export function Stats() {
  return (
    <section style={{ background: "var(--section-light-2)" }} className="py-16 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div
                className="font-black mb-1"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#e12722", fontFamily: "Nunito, sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-sm font-semibold" style={{ color: "#444", fontFamily: "Nunito, sans-serif" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
