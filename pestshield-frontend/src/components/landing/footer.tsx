import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Ürün: [
    { label: "Özellikler", href: "#ozellikler" },
    { label: "Paketler", href: "#paketler" },
    { label: "SSS", href: "#sss" },
  ],
  Şirket: [{ label: "Giriş Yap", href: `${process.env.NEXT_PUBLIC_APP_URL}/login` }],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Image
              src="/logo-trimmed.png"
              alt="PestShield"
              width={1211}
              height={463}
              className="h-10 w-auto"
            />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Denetime Hazır, Veri Odaklı Dijital Kalkan.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold">{section}</h4>
              <ul className="mt-3 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PestShield. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
