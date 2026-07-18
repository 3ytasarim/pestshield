"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, Clock, FlaskConical, ReceiptText, Sparkles } from "lucide-react";
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
}

const REPORTS: ReportCardDef[] = [
  {
    href: "/dashboard/client/reports/tahakkuk",
    icon: ReceiptText,
    title: "Tahakkuk Raporları",
    description: "Tüm müşteriler genelinde periyot ziyaretlerinin tahakkuk durumu — tamamlanan ve bekleyen EK-1 kayıtları tek tabloda.",
    accent: "blue",
  },
  {
    href: "/dashboard/client/reports/pdks",
    icon: Clock,
    title: "PDKS Personel Çalışma Saatleri",
    description: "Teknisyenlerin günlük mesai başlangıç/bitiş saatleri, çalışma süresi ve saha rotası özeti.",
    accent: "emerald",
  },
  {
    href: "/dashboard/client/reports/trend-analysis",
    icon: ChartNoAxesCombined,
    title: "Trend Analiz Raporları",
    description: "Müşteri ve hizmet seçerek o hizmete ait tüm krokilerin genel trend analizini görüntüleyin.",
    accent: "amber",
  },
  {
    href: "/dashboard/client/reports/chemical-usage",
    icon: FlaskConical,
    title: "Biyosidal Ürün Kullanım Raporu",
    description: "EK-1 formuyla aynı alan yapısında, doldurup anında yazdırabileceğiniz bağımsız biyosidal ürün uygulama raporu.",
    accent: "blue",
  },
  {
    href: "/dashboard/client/reports/ai",
    icon: Sparkles,
    title: "AI Analizleri",
    description: "AI Command Center'ın operasyonel, risk, teknisyen ve denetim zekası — sohbet etmeden, tek sayfada.",
    accent: "amber",
  },
];

const ACCENT_CLASSES: Record<ReportCardDef["accent"], string> = {
  emerald: "bg-success/10 text-success",
  blue: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function OperationsReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Operasyon Raporları</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Saha operasyonuna ait tüm hazır raporlar tek yerde — tahakkuk, mesai, trend analizi ve biyosidal ürün kullanımı.
        </p>
      </motion.div>

      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report, index) => (
            <ReportCard key={report.href} report={report} delay={index * 0.05} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, delay }: { report: ReportCardDef; delay: number }) {
  const Icon = report.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={report.href}>
        <Card className={cn(GLASS_CARD, "h-full cursor-pointer rounded-2xl")}>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-2">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ACCENT_CLASSES[report.accent])}>
                <Icon className="size-5" />
              </span>
            </div>
            <div>
              <p className="font-semibold leading-tight text-foreground">{report.title}</p>
              <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{report.description}</p>
            </div>
            <div className="flex items-center justify-end border-t border-border/60 pt-3 text-xs">
              <span className="flex items-center gap-1 font-medium text-primary">
                Rapor Oluştur
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
