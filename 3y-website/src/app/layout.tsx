import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "3Y Tasarım & Yazılım | Web Tasarım, Yazılım ve AI Çözümleri",
    template: "%s | 3Y Tasarım & Yazılım",
  },
  description:
    "Web tasarım, e-ticaret, özel yazılım, QR menü ve yapay zeka çözümleri. Google'dan ChatGPT'ye kadar görünür olun. İstanbul, Ankara, İzmir ve tüm Türkiye.",
  keywords: [
    "web tasarım", "kurumsal web tasarım", "özel yazılım", "e-ticaret sitesi",
    "QR menü sistemi", "yapay zeka chatbot", "SEO hizmetleri", "GEO optimizasyon",
    "dijital ajans", "İstanbul web tasarım",
  ],
  authors: [{ name: "3Y Tasarım & Yazılım Hizmetleri" }],
  creator: "3Y Tasarım & Yazılım Hizmetleri",
  metadataBase: new URL("https://3ytasarim.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://3ytasarim.com",
    siteName: "3Y Tasarım & Yazılım Hizmetleri",
    title: "3Y Tasarım & Yazılım | Web Tasarım, Yazılım ve AI Çözümleri",
    description: "Web tasarım, e-ticaret, özel yazılım, QR menü ve yapay zeka çözümleri. Türkiye genelinde premium dijital ajans.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "3Y Tasarım & Yazılım" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3Y Tasarım & Yazılım | Web Tasarım, Yazılım ve AI Çözümleri",
    description: "Web tasarım, e-ticaret, özel yazılım, QR menü ve yapay zeka çözümleri.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
