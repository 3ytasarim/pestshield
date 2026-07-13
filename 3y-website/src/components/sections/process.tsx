"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STEPS = [
  { num: "01", icon: "🔍", title: "Keşif & Strateji", desc: "Hedef kitleni, rakipleri ve işletme hedeflerini derinlemesine analiz ederek proje yol haritasını oluştururuz." },
  { num: "02", icon: "🎨", title: "Tasarım & Prototip", desc: "Figma'da pixel-perfect wireframe ve interaktif prototip hazırlar, geri bildirimlerinle şekillendiririz." },
  { num: "03", icon: "💻", title: "Geliştirme", desc: "Next.js, TypeScript ve modern araçlarla hızlı, güvenli, SEO-hazır kod yazarız." },
  { num: "04", icon: "🚀", title: "Test & Lansman", desc: "Tüm cihazlarda kapsamlı test, performans optimizasyonu ve sorunsuz yayına alma süreci." },
];

export function Process() {
  return (
    <section style={{ background: "var(--section-light-2)" }} className="py-20 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <h2 className="font-black mb-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
            <span style={{ color: "#e12722" }}># </span>Nasıl Yapıyoruz ?
          </h2>
          <div className="font-bold text-sm tracking-widest uppercase" style={{ color: "#e12722" }}>
            ÇALIŞMA SÜRECİMİZ
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-px z-0"
                  style={{ background: "linear-gradient(90deg, #e12722 0%, rgba(225,39,34,0.2) 100%)" }} />
              )}

              <div className="relative z-10">
                {/* Step number circle */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                  style={{
                    background: "#fff",
                    boxShadow: "0 4px 20px rgba(225,39,34,0.15)",
                    border: "2px solid rgba(225,39,34,0.20)",
                  }}
                >
                  {step.icon}
                </motion.div>

                <div className="font-black text-5xl mb-1" style={{ color: "rgba(225,39,34,0.08)", fontFamily: "Nunito, sans-serif", lineHeight: 1 }}>
                  {step.num}
                </div>
                <h3 className="font-black text-base mb-2" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#666" }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
