"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, FileBarChart, FlaskConical, Package, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

interface ReportCardDef {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "emerald" | "blue" | "amber";
  comingSoon?: boolean;
}

const REPORTS: ReportCardDef[] = [
  {
    href: "/dashboard/customer/reports/technical",
    icon: FileBarChart,
    title: "Teknik Raporlar",
    description: "Teknisyenin ziyaretlerinizde oluşturduğu Biyosidal Ürün Uygulama Raporları.",
    accent: "blue",
  },
  {
    href: "/dashboard/customer/reports/trend-analiz",
    icon: ChartNoAxesCombined,
    title: "Trend Analiz Raporları",
    description: "Hizmetinize ait istasyon denetimlerinin aylık trend analizi.",
    accent: "amber",
  },
  {
    href: "/dashboard/customer/reports/tahakkuk",
    icon: ReceiptText,
    title: "Tahakkuk Raporları",
    description: "Periyot ziyaretlerinizin tahakkuk durumu — tamamlanan ve bekleyen kayıtlar.",
    accent: "emerald",
  },
  {
    href: "/dashboard/customer/reports/malzeme",
    icon: FlaskConical,
    title: "Malzeme Raporları",
    description: "Ziyaretlerde kullanılan biyosidal ürün ve malzeme dökümü.",
    accent: "blue",
    comingSoon: true,
  },
  {
    href: "/dashboard/customer/reports/kalan-hizmet",
    icon: Package,
    title: "Kalan Hizmet Raporları",
    description: "Sözleşme kapsamında kalan periyot ve ziyaret hakkı özeti.",
    accent: "amber",
    comingSoon: true,
  },
];

const ACCENT_CLASSES: Record<ReportCardDef["accent"], string> = {
  emerald: "bg-success/10 text-success",
  blue: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function CustomerPortalReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Raporlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">İlaçlama firmanızın hesabınız için oluşturduğu tüm hazır raporlar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report, index) => (
          <ReportCard key={report.href} report={report} delay={index * 0.05} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report, delay }: { report: ReportCardDef; delay: number }) {
  const Icon = report.icon;
  const content = (
    <Card className={cn(GLASS_CARD, "h-full rounded-2xl", report.comingSoon ? "opacity-50" : "cursor-pointer")}>
      <CardContent className="flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ACCENT_CLASSES[report.accent])}>
            <Icon className="size-5" />
          </span>
          {report.comingSoon && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Yakında</span>
          )}
        </div>
        <div>
          <p className="font-semibold leading-tight text-foreground">{report.title}</p>
          <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{report.description}</p>
        </div>
        {!report.comingSoon && (
          <div className="flex items-center justify-end border-t border-border/60 pt-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-primary">
              Görüntüle
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}>
      {report.comingSoon ? content : <Link href={report.href}>{content}</Link>}
    </motion.div>
  );
}
