"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const faqs = [
  { q: "Web sitesi yaptırmak ne kadar sürer?", a: "Standart kurumsal web siteleri 2–4 haftada teslim edilir. Özel yazılım ve e-ticaret projeleri karmaşıklığa göre 4–8 hafta sürebilir. MVP'yi önce yayına alır, sonra geliştirmeye devam ederiz." },
  { q: "Fiyatlandırma nasıl çalışıyor?", a: "Her proje ihtiyaca göre fiyatlandırılır. Teklif formunu doldurduğunuzda 24 saat içinde ayrıntılı fiyat teklifi alırsınız. Gizli maliyet yoktur." },
  { q: "Proje bittikten sonra destek veriyor musunuz?", a: "Evet. Teknik destek ve bakım hizmetimiz ile projeniz yayına girdikten sonra da yanınızdayız. Güncelleme, eklenti ve teknik sorunlarda destek sağlıyoruz." },
  { q: "SEO ve GEO arasındaki fark nedir?", a: "SEO Google ve Bing gibi geleneksel arama motorlarına yönelik optimizasyondur. GEO ise ChatGPT, Gemini, Claude, Perplexity gibi yapay zeka asistanlarının sitenizi anlayıp önerebilmesi için yapılan optimizasyondur. İkisini birlikte sunuyoruz." },
  { q: "QR menü sistemi ne kadar sürede hazır olur?", a: "Standart QR menü sistemi 2–3 iş günü içinde aktif hale gelir. Menü içeriklerinizi ilettiğinizde hızlıca yayına alırız." },
  { q: "AI chatbot entegrasyonu nasıl çalışıyor?", a: "Sitenize entegre edilen AI chatbot işletmenizin hizmetlerini öğrenir, ziyaretçilere 7/24 yanıt verir, lead qualification yapar ve gerektiğinde WhatsApp veya e-posta ile sizi bilgilendirir." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ background: "var(--section-light-2)" }} className="px-5 sm:px-8 py-20">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease }}
          className="text-center mb-14"
        >
          <h2 className="font-black mb-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
            <span style={{ color: "#e12722" }}># </span>Sık Sorulan Sorular ?
          </h2>
          <div className="font-bold text-sm tracking-widest uppercase" style={{ color: "#e12722" }}>SSS</div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease }}
          >
            <h3 className="font-black mb-4" style={{ fontSize: "clamp(22px, 3vw, 34px)", color: "#111", fontFamily: "Nunito, sans-serif" }}>
              Aklınızdaki<br />tüm sorular burada.
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
              Hâlâ aklınızda soru varsa, bize WhatsApp veya e-posta ile ulaşabilirsiniz. 24 saat içinde yanıt veriyoruz.
            </p>
          </motion.div>

          {/* Right — accordion */}
          <div className="flex flex-col" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-bold pr-4" style={{ color: "#111", fontFamily: "Nunito, sans-serif" }}>
                    {faq.q}
                  </span>
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#e12722", color: "#fff" }}>
                    {open === i ? <Minus size={12} /> : <Plus size={12} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-sm leading-relaxed" style={{ color: "#666" }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
