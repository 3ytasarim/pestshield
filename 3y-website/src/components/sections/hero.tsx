"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MatrixRain } from "@/components/ui/matrix-rain";
import { motion, AnimatePresence } from "framer-motion";

/* cycling words — matches WTS style with 3Y content */
const WORDS = [
  "Dijital_",
  "Responsive_",
  "AI Destekli_",
  "SEO Uyumlu_",
  "Kurumsal_",
  "E-Ticaret_",
];

const STATIC = "Web Tasarım";

const PARTNERS = [
  { label: "Google Partner",    w: 90  },
  { label: "Bing Ads",          w: 80  },
  { label: "Meta Partner",      w: 80  },
  { label: "Microsoft Partner", w: 110 },
];

function TypewriterHeadline() {
  const [wordIdx, setWordIdx]   = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"type" | "pause" | "erase">("type");
  const [cursor, setCursor]   = useState(true);

  const word = WORDS[wordIdx];

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "type") {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      } else {
        timeout = setTimeout(() => setPhase("pause"), 1800);
      }
    } else if (phase === "pause") {
      timeout = setTimeout(() => setPhase("erase"), 400);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      } else {
        setWordIdx((i) => (i + 1) % WORDS.length);
        setPhase("type");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, word]);

  return (
    <h1
      className="font-display font-black text-white text-center leading-tight select-none"
      style={{ fontSize: "clamp(40px, 7vw, 88px)", lineHeight: 1.1 }}
    >
      <span style={{ color: "#F7941D" }}>{displayed}</span>
      <span
        style={{
          color: "#F7941D",
          opacity: cursor ? 1 : 0,
          transition: "opacity 0.1s",
          fontWeight: 300,
        }}
      >|</span>{" "}
      <span className="text-white">{STATIC}</span>
    </h1>
  );
}

export function Hero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Matrix rain canvas */}
      <MatrixRain className="absolute inset-0 w-full h-full" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* Hero content — centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 text-center pt-24 pb-10">

        {/* Main headline with typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 w-full"
        >
          <TypewriterHeadline />
        </motion.div>

        {/* Subtitles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 space-y-1"
        >
          <p className="text-white text-lg" style={{ fontFamily: "Nunito, sans-serif" }}>
            Türkiye&apos;nin <strong style={{ color: "#FFD700" }}>Ödüllü</strong> Web Tasarım ve Yazılım Ajansı ile
          </p>
          <p className="text-white text-lg">
            Dünya Standartlarını <strong style={{ color: "#F7941D" }}>Web Sitenizde</strong> İnceleyin!
          </p>
          <p className="font-bold text-base" style={{ color: "#FFD700" }}>
            Biz farklıyız, sizde farklı olun.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-12"
        >
          {/* Red button */}
          <Link
            href="/iletisim"
            className="group flex flex-col items-center justify-center px-10 py-3 text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
              borderRadius: 50,
              boxShadow: "0 4px 20px rgba(211,47,47,0.50), 0 2px 8px rgba(0,0,0,0.4)",
              minWidth: 200,
            }}
          >
            <span className="text-xs opacity-80 font-normal leading-none mb-0.5">
              sorularınız için ?
            </span>
            <span className="font-black text-lg leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              Bize Yazın
            </span>
          </Link>

          {/* Orange/accent button */}
          <Link
            href="/teklif-al"
            className="group flex flex-col items-center justify-center px-10 py-3 text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #F7941D 0%, #e07810 100%)",
              borderRadius: 50,
              boxShadow: "0 4px 20px rgba(247,148,29,0.55), 0 2px 8px rgba(0,0,0,0.4)",
              minWidth: 200,
            }}
          >
            <span className="text-xs opacity-80 font-normal leading-none mb-0.5">
              projeniz mi var ?
            </span>
            <span className="font-black text-lg leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              Teklif Alın
            </span>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1 opacity-50"
        >
          <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
            <path d="M2 2l10 10L22 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
            <path d="M2 2l10 10L22 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Right circle badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-6 top-1/3 -translate-y-1/2 hidden lg:flex items-center justify-center"
        style={{
          width: 140, height: 140,
          borderRadius: "50%",
          background: "rgba(10,10,10,0.85)",
          border: "2px solid rgba(247,148,29,0.50)",
          boxShadow: "0 0 30px rgba(247,148,29,0.20)",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div className="text-white text-xs leading-snug">
          <div className="font-black text-lg" style={{ color: "#F7941D" }}>2026</div>
          <div className="text-[11px] opacity-80">dijital inovasyon</div>
          <div className="text-[11px] opacity-80">yılı olacak.</div>
          <div className="font-bold text-[11px] mt-1" style={{ color: "#F7941D" }}>3Y ile</div>
          <div className="text-[10px] opacity-70">markanızı zirveye</div>
          <div className="text-[10px] opacity-70">çıkarın!</div>
        </div>
      </motion.div>

      {/* Bottom bar: partners + Google rating */}
      <div
        className="relative z-10 border-t w-full"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Partner logos */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {PARTNERS.map((p) => (
              <div
                key={p.label}
                className="text-[11px] font-bold opacity-50 text-white border rounded px-2 py-0.5"
                style={{ borderColor: "rgba(255,255,255,0.20)", width: p.w }}
              >
                {p.label}
              </div>
            ))}
          </div>

          {/* Google rating */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold" style={{ color: "#4285F4" }}>Google</span>
            <span style={{ color: "#FFD700", letterSpacing: 1 }}>★★★★★</span>
            <span className="text-white text-xs opacity-70">50+ değerlendirme</span>
            <span style={{ color: "#e74c3c" }}>❤</span>
          </div>
        </div>
      </div>
    </section>
  );
}
