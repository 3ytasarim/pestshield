import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { prisma } from "@/lib/db";
import { isMultiTenant } from "@/lib/tenant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: "PestShield | Uygulama",
    description: "Denetime Hazır, Veri Odaklı Dijital Kalkan",
  };
  // Standalone (tek firmalı) dağıtımda ne favicon ne de sekme başlığı/açıklaması PestShield'ınki
  // olur — kurulan firmanın Şirket Ayarları'nda girdiği ad ve yüklediği görseller kullanılır;
  // hiçbiri girilmemişse varsayılana (PestShield) düşülür. Favicon BİLEREK logoUrl (firma logosu)
  // değil, ayrı yüklenen faviconUrl'den okunur — ikisi karıştırılmamalı.
  if (isMultiTenant()) return base;
  try {
    const owner = await prisma.user.findFirst({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "asc" },
      select: { companyName: true, shortName: true, faviconUrl: true },
    });
    if (!owner) return base;
    const displayName = owner.companyName || owner.shortName || null;
    return {
      title: displayName ? `${displayName} | Uygulama` : base.title,
      description: displayName ? `${displayName} — Saha Servis ve Müşteri Yönetimi` : base.description,
      ...(owner.faviconUrl ? { icons: { icon: owner.faviconUrl, apple: owner.faviconUrl } } : {}),
    };
  } catch {
    // DB'ye ulaşılamazsa varsayılan başlık/favicon kullanılır.
  }
  return base;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
