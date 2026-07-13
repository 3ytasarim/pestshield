"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const POINTS = [
  { icon: "🎨", title: "Dünya Standartlarında Tasarım", desc: "Awwwards ve Framer Showcase seviyesinde, ödüllü ajanslarla rekabet eden arayüzler." },
  { icon: "⚡", title: "Hız Garantisi", desc: "3-4 hafta içinde teslim. Sprint tabanlı süreçle her adımı takip edersiniz." },
  { icon: "🤖", title: "AI Entegrasyonu", desc: "Claude API ile akıllı chatbot, semantik arama ve otomasyon çözümleri." },
  { icon: "📈", title: "SEO & GEO Hazır", desc: "Google'dan ChatGPT'ye kadar tüm arama motorları için optimize." },
  { icon: "🛡️", title: "7/24 Teknik Destek", desc: "Proje sonrası bakım, güncelleme ve destek paketi dahil." },
  { icon: "💎", title: "Şeffaf Fiyatlandırma", desc: "Gizli ücret yok. Her şey baştan bellidir, sözleşmeyle güvence altında." },
];

export function WhyUs() {
  return (
    <section style={{ background: "var(--section-light)" }} className="py-20 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <h2 className="font-black mb-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
            <span style={{ color: "#e12722" }}># </span>Neden Bizi Seçmelisiniz ?
          </h2>
          <div className="font-bold text-sm tracking-widest uppercase" style={{ color: "#e12722" }}>
            FARKIMIZ
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.10)" }}
              className="p-6 rounded-2xl bg-white"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", cursor: "default" }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl mb-4"
              >
                {p.icon}
              </motion.div>
              <h3 className="font-black text-base mb-2" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
