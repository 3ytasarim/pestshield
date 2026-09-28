import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { prisma } from "@/lib/db";
import { isMultiTenant } from "@/lib/tenant";
import { DEFAULT_FAVICON_DATA_URL } from "@/lib/default-favicon";
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
  // NOT: src/app/favicon.ico dosyası BİLEREK yok — Next.js o dosya varsa otomatik
  // olarak ayrı, statik bir <link rel="icon" href="/favicon.ico"> ekliyor ve bu,
  // aşağıdaki dinamik icons alanıyla ÇAKIŞIP tarayıcıda genelde statik olanın
  // kazanmasına yol açıyordu (standalone'da yüklenen favicon hiç görünmüyordu).
  // Bunun yerine varsayılan PestShield favicon'u da aynı dinamik yoldan, base64
  // olarak veriliyor — tek kaynak, çakışma yok.
  const base: Metadata = {
    title: "PestShield | Uygulama",
    description: "Denetime Hazır, Veri Odaklı Dijital Kalkan",
    icons: { icon: DEFAULT_FAVICON_DATA_URL, apple: DEFAULT_FAVICON_DATA_URL },
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
      icons: owner.faviconUrl
        ? { icon: owner.faviconUrl, apple: owner.faviconUrl }
        : base.icons,
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
