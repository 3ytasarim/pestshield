"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Yapay Zeka", href: "#ai" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Paketler", href: "#paketler" },
  { label: "SSS", href: "#sss" },
];

// app.pestshield.com ayrı bir proje (pestshield-app) olduğu için
// cross-origin link kullanılır - Next.js <Link> yerine düz <a>.
const APP_LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isScrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-trimmed.png"
            alt="PestShield"
            width={1211}
            height={463}
            className="h-10 w-auto sm:h-11"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" nativeButton={false} render={<a href={APP_LOGIN_URL} />}>
            Giriş Yap
          </Button>
          <Button nativeButton={false} render={<a href={APP_LOGIN_URL} />}>
            Ücretsiz Demo
          </Button>
        </div>

        <button
          className="flex items-center justify-center md:hidden"
          aria-label="Menüyü aç/kapat"
          onClick={() => setIsMobileOpen((prev) => !prev)}
        >
          {isMobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border bg-background px-6 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                nativeButton={false}
                render={<a href={APP_LOGIN_URL} />}
              >
                Giriş Yap
              </Button>
              <Button className="flex-1" nativeButton={false} render={<a href={APP_LOGIN_URL} />}>
                Ücretsiz Demo
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
