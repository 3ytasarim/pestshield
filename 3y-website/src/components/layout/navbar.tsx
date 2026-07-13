"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Portföy",   href: "/portfolio"  },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Blog",      href: "/blog"       },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background:    scrolled ? "rgba(8,8,8,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom:  scrolled ? "1px solid rgba(247,148,29,0.10)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="3Y Tasarım & Yazılım Hizmetleri"
              width={140}
              height={48}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group relative text-sm transition-colors duration-200 hover:text-white"
                style={{ color: "var(--text-secondary)" }}
              >
                {l.label}
                {/* underline sweep */}
                <span
                  className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100"
                  style={{ background: "var(--accent)" }}
                />
              </Link>
            ))}
          </nav>

          {/* CTA + burger */}
          <div className="flex items-center gap-3">
            <Link
              href="/teklif-al"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 text-white font-display"
              style={{
                background: "linear-gradient(135deg, #F7941D 0%, #e07810 100%)",
                boxShadow: "0 0 20px rgba(247,148,29,0.35)",
              }}
            >
              Teklif Al <ArrowUpRight size={13} />
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-white/60 hover:text-white transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menü"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
            style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
          >
            <nav className="flex flex-col p-5 gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-base py-3 border-b font-display hover:text-white transition-colors"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/teklif-al"
                className="mt-4 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white font-display"
                style={{ background: "linear-gradient(135deg, #F7941D 0%, #e07810 100%)" }}
                onClick={() => setOpen(false)}
              >
                Teklif Al <ArrowUpRight size={14} />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
