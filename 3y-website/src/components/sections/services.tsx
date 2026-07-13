"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const LEFT_SERVICES = [
  {
    title: "Web Tasarım",
    desc: "Modern, işlevsel, mobil uyumlu, özgün, kullanıcı dostu, ekonomik, yenilikçi, profesyonel, stratejik, yüksek geri dönüş ve başarı odaklı web tasarım projeleri üretiyoruz.",
  },
  {
    title: "SEO Optimizasyonu",
    desc: "Projelerin geliştirilme aşamasında, temel ve modern SEO kurallarını dikkate alıyor ve projenizi bu kurallara göre geliştiriyoruz.",
  },
  {
    title: "Logo & Kurumsal Kimlik",
    desc: "Profesyonel, yaratıcı, özgün, hatırlanması kolay, kurumsal kimlik, logo, amblem, katalog, broşür, kurumsal evrak, afiş vb. yayınlar oluşturuyoruz.",
  },
];

const RIGHT_SERVICES = [
  {
    title: "Yazılım Geliştirme",
    desc: "Next.js, Node.js, TypeScript, PostgreSQL, Supabase ve modern stack ile istediğiniz yazılım projesini siz hayal edin biz gerçekleştirelim.",
  },
  {
    title: "Reklam Yönetimi",
    desc: "Google Ads, Meta, Instagram veya LinkedIn reklamlarınızın optimizasyon ve yönetimini işi bilen ellere bırakın. Hedef kitlenize sizi biz ulaştıralım.",
  },
  {
    title: "Web Danışmanlık",
    desc: "Bilişim alanındaki ihtiyaçlarınıza profesyonel çözümler üretirken, güvenilir iş ortağınız olarak, esas işinizi destekleyici bilişim çalışmalarını üstlenmekteyiz.",
  },
];

/* Phone mockup icon grid rows */
const ICON_ROWS = [
  ["📊", "📷", "🔧", "🎯", "📱"],
  ["🏆", "💡", "🛒", "⭐", "📈"],
  ["🏛️", "📋", "🎨", "🚀", "📌"],
  ["🎯", "🔨", "📦", "🔍", "🌐"],
  ["⚙️", "✈️", "🌍", "🎮", "📲"],
  ["✨", "🌸", "📧", "🎬", "⚽"],
  ["💬", "🎵", "🎯", "🔴", "🔧"],
];

export function Services() {
  return (
    <section style={{ background: "var(--section-light)" }} className="py-20 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <h2 className="font-black mb-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
            <span style={{ color: "#e12722" }}># </span>Neler Yapıyoruz ?
          </h2>
          <div className="font-bold text-sm tracking-widest uppercase" style={{ color: "#e12722" }}>
            HİZMET ÇEŞİTLERİ
          </div>
        </motion.div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left column */}
          <div className="space-y-10">
            {LEFT_SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                className="text-right"
              >
                <h3 className="font-black text-lg mb-2" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Center — phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}
            className="flex justify-center"
          >
            <div className="relative" style={{ width: 220 }}>
              {/* Phone frame */}
              <div
                className="relative mx-auto overflow-hidden"
                style={{
                  width: 220, borderRadius: 36,
                  background: "#1a1a2e",
                  border: "6px solid #2d2d44",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
                  padding: "28px 8px 16px",
                }}
              >
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full" style={{ background: "#2d2d44" }} />

                {/* Icon grid */}
                <div className="flex flex-col gap-1.5">
                  {ICON_ROWS.map((row, ri) => (
                    <div key={ri} className="flex gap-1.5 justify-center">
                      {row.map((icon, ci) => (
                        <motion.div
                          key={ci}
                          whileHover={{ scale: 1.15 }}
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 3 + (ri * ci * 0.1), repeat: Infinity, ease: "easeInOut", delay: ri * 0.2 + ci * 0.1 }}
                          className="flex items-center justify-center rounded-xl text-base"
                          style={{
                            width: 34, height: 34,
                            background: "linear-gradient(135deg, #fff 0%, #f0f4f8 100%)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            fontSize: 16,
                          }}
                        >
                          {icon}
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Home indicator */}
                <div className="mt-3 flex justify-center">
                  <div className="w-16 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                </div>
              </div>

              {/* Floating bubble — left */}
              <motion.div
                animate={{ x: [-6, 6, -6], y: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-10 top-1/4 rounded-full flex items-center justify-center"
                style={{ width: 52, height: 52, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
              >
                <span style={{ fontSize: 22 }}>🎯</span>
              </motion.div>

              {/* Floating bubble — right */}
              <motion.div
                animate={{ x: [6, -6, 6], y: [4, -4, 4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-10 top-1/2 rounded-full flex items-center justify-center"
                style={{ width: 52, height: 52, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
              >
                <span style={{ fontSize: 22 }}>🚀</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-10">
            {RIGHT_SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                className="text-left"
              >
                <h3 className="font-black text-lg mb-2" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
