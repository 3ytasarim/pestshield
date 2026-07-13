"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function CtaBanner() {
  return (
    <section className="py-24 px-5 sm:px-8 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(247,148,29,0.14) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }} className="flex justify-center mb-8">
          <div className="pill"><span style={{ color: "var(--accent)" }}>◆</span> Hemen Başlayın</div>
        </motion.div>

        {/* Headline */}
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.06, ease: EASE }}
          className="font-display font-bold mb-6"
          style={{ fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 1.0, color: "#f5f4f2" }}>
          Projenizi hayata<br />
          <span style={{ color: "var(--accent)" }}>geçirelim.</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
          className="text-base leading-relaxed mb-10 mx-auto max-w-md"
          style={{ color: "rgba(255,255,255,0.42)" }}>
          İlk danışma ücretsiz. 24 saat içinde geri dönüyor, 3–4 haftada teslim ediyoruz.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/teklif-al"
            className="relative flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-white font-display group/btn overflow-hidden"
            style={{ background: "linear-gradient(135deg, #F7941D 0%, #e07810 100%)", boxShadow: "0 0 36px rgba(247,148,29,0.45)" }}>
            <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, #FFA940 0%, #F7941D 100%)" }} />
            <span className="relative z-10 flex items-center gap-2.5">Ücretsiz Teklif Al <ArrowRight size={15} /></span>
          </Link>
          <Link href="https://wa.me/905001234567" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-medium font-display transition-all duration-200 hover:text-white"
            style={{ border: "1px solid rgba(247,148,29,0.22)", color: "rgba(255,255,255,0.50)" }}>
            <MessageCircle size={15} /> WhatsApp&apos;tan Yazın
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.34 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs"
          style={{ color: "rgba(255,255,255,0.24)" }}>
          {["✓ İlk danışma ücretsiz", "✓ 24s içinde geri dönüş", "✓ 100% müşteri memnuniyeti"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
