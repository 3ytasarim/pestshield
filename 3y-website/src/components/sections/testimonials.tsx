"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const TESTIMONIALS = [
  { name: "Ahmet Kaya", role: "Kurucu, Kaya Mobilya", avatar: "AK", rating: 5, text: "3Y ekibi web sitemizi tamamen yeniledi. Müşteri sayımız 3 ay içinde %65 arttı. Tasarım kalitesi ve hız beklentilerimi çok aştı." },
  { name: "Selin Arslan", role: "CEO, TechStart İstanbul", avatar: "SA", rating: 5, text: "SaaS platformumuzu 4 haftada teslim ettiler. Next.js ve Supabase entegrasyonu kusursuz çalışıyor. Kesinlikle tavsiye ederim." },
  { name: "Mehmet Öztürk", role: "Şef, Öztürk Restaurant", avatar: "MÖ", rating: 5, text: "QR menü sistemimiz çok profesyonel çıktı. Müşterilerimiz çok beğeniyor, güncelleme yapmak artık saniyeler sürüyor." },
  { name: "Fatma Yıldız", role: "Pazarlama Müdürü, E-Shop TR", avatar: "FY", rating: 5, text: "SEO çalışmaları sayesinde Google'da ilk 3'e girdik. Organik trafiğimiz 4 ayda 3 katına çıktı. Harika bir ekip." },
  { name: "Can Demir", role: "Kurucu, Demir Hukuk", avatar: "CD", rating: 5, text: "Hukuk büromuz için kurumsal bir site istedik, Awwwards kalitesinde teslim ettiler. Müvekkillerimizden çok olumlu geri dönüşler alıyoruz." },
  { name: "Ayşe Çelik", role: "Girişimci, AyşeStyle", avatar: "AÇ", rating: 5, text: "Küçük bütçemle büyük işler çıkardılar. E-ticaret sitem ilk ayda kâra geçti. 7/24 destek paketi çok değerliydi." },
];

export function Testimonials() {
  return (
    <section style={{ background: "var(--section-light)" }} className="py-20 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <h2 className="font-black mb-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
            <span style={{ color: "#e12722" }}># </span>Müşterilerimiz Ne Diyor ?
          </h2>
          <div className="font-bold text-sm tracking-widest uppercase" style={{ color: "#e12722" }}>
            MÜŞTERİ YORUMLARI
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}
              className="p-6 rounded-2xl bg-white flex flex-col gap-4"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", cursor: "default" }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} style={{ color: "#F7941D", fontSize: 15 }}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#555" }}>
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #e12722 0%, #b71c1c 100%)" }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "#999" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
