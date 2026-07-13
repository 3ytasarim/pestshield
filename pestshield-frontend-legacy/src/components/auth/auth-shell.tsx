import { ShieldCheck, ScanLine, ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const FEATURES = [
  { icon: ScanLine, text: "QR kod ile saniyeler içinde saha kontrolü" },
  { icon: ClipboardCheck, text: "BRCGS & HACCP uyumlu izlenebilirlik" },
  { icon: ShieldCheck, text: "Gerçek zamanlı trend ve uygunsuzluk takibi" },
];

/**
 * Login ve Sign Up sayfalarının ortak split-screen kabuğu: sol tarafta
 * marka/değer önerisi paneli (mobilde üstte, sadeleşmiş halde), sağ
 * tarafta form kartı. Tamamen responsive - mobilde tek kolon.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Marka paneli */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 px-8 py-10 text-white md:w-1/2 md:px-16 md:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <ShieldCheck className="size-7" />
          <span className="text-xl font-bold tracking-tight">PestShield</span>
        </div>

        <div className="relative hidden md:block">
          <h1 className="mb-3 text-3xl font-bold leading-tight lg:text-4xl">
            Denetime Hazır,
            <br />
            Veri Odaklı Dijital Kalkan
          </h1>
          <p className="max-w-md text-white/80">
            Saha personelinizin QR kod okutarak girdiği her veri, tek bir
            platformda izlenebilirlik ve uygunluk raporuna dönüşür.
          </p>
        </div>

        <ul className="relative hidden flex-col gap-3 md:flex">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-white/90">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Form paneli */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
