import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Services } from "@/components/sections/services";
import { WhyUs } from "@/components/sections/why-us";
import { Process } from "@/components/sections/process";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { CtaBanner } from "@/components/sections/cta-banner";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://3ytasarim.com/#organization",
      name: "3Y Tasarım & Yazılım Hizmetleri",
      url: "https://3ytasarim.com",
      description:
        "Web tasarım, özel yazılım, e-ticaret, QR menü ve yapay zeka çözümleri sunan Türkiye merkezli premium dijital ajans.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "İstanbul",
        addressCountry: "TR",
      },
      areaServed: ["TR", "DE", "NL", "FR", "GB"],
      knowsAbout: ["Web Tasarım", "E-Ticaret", "Özel Yazılım", "CRM", "QR Menü", "SEO", "GEO", "AI Chatbot"],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://3ytasarim.com/#localbusiness",
      name: "3Y Tasarım & Yazılım Hizmetleri",
      priceRange: "₺₺₺",
      address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
    },
    {
      "@type": "WebSite",
      "@id": "https://3ytasarim.com/#website",
      url: "https://3ytasarim.com",
      name: "3Y Tasarım & Yazılım Hizmetleri",
      inLanguage: "tr-TR",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Services />
        <WhyUs />
        <Process />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
