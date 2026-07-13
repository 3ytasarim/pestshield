import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const cols = [
  {
    title: "Hizmetler",
    links: [
      { label: "Web Tasarım",   href: "/hizmetler/web-tasarim"  },
      { label: "Yapay Zeka",    href: "/hizmetler/yapay-zeka"   },
      { label: "E-Ticaret",     href: "/hizmetler/e-ticaret"    },
      { label: "Özel Yazılım",  href: "/hizmetler/yazilim"      },
      { label: "QR Menü",       href: "/hizmetler/qr-menu"      },
      { label: "SEO & GEO",     href: "/hizmetler/seo"          },
    ],
  },
  {
    title: "Şirket",
    links: [
      { label: "Hakkımızda",    href: "/hakkimizda"  },
      { label: "Portföy",       href: "/portfolio"   },
      { label: "Blog",          href: "/blog"         },
      { label: "İletişim",      href: "/iletisim"    },
      { label: "Teklif Al",     href: "/teklif-al"   },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik" },
      { label: "Kullanım Koşulları",  href: "/kosullar"  },
      { label: "KVKK",                href: "/kvkk"       },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/3ytasarim" },
  { label: "LinkedIn",  href: "https://linkedin.com/company/3ytasarim" },
  { label: "Twitter",   href: "https://twitter.com/3ytasarim" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--bg)", borderTop: "1px solid rgba(247,148,29,0.10)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center mb-5">
              <Image src="/logo.svg" alt="3Y Tasarım & Yazılım" width={130} height={44} className="h-8 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              İstanbul&apos;dan dünyaya — web tasarım, yapay zeka ve yazılım çözümleriyle işletmenizi büyütüyoruz.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs transition-colors duration-200 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.30)" }}>
                  {s.label} <ArrowUpRight size={10} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(247,148,29,0.60)" }}>
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: "rgba(255,255,255,0.35)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(247,148,29,0.08)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            © {new Date().getFullYear()} 3Y Tasarım & Yazılım Hizmetleri. Tüm hakları saklıdır.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            İstanbul, Türkiye 🇹🇷
          </p>
        </div>
      </div>
    </footer>
  );
}
