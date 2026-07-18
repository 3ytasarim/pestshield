"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ClipboardList, FileSpreadsheet } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useWeather } from "@/hooks/use-weather";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { getCompanySettings } from "@/lib/company-settings";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { WeatherForecastCard } from "@/components/dashboard/weather-forecast-card";
import { ExchangeRateWidget } from "@/components/dashboard/exchange-rate-widget";
import { LicenseWidget } from "@/components/dashboard/license-widget";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RiskCard } from "@/components/dashboard/risk-card";
import { CollectionSummaryCard } from "@/components/dashboard/collection-summary-card";
import { AiRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { PestActivityChart } from "@/components/dashboard/pest-activity-chart";
import { AuditReadinessCard } from "@/components/dashboard/audit-readiness-card";
import { PestBackground } from "@/components/dashboard/pest-background";
import { formatNumber, formatToday } from "@/components/dashboard/shared";
import type {
  TodayServicesSummary,
  OpenJobsSummary,
  PendingOffersSummary,
  PendingCollectionsSummary,
  CriticalRisksSummary,
  AiRecommendation,
  ActivityItem,
  Appointment,
  PestActivityPoint,
  AuditReadiness,
} from "@/lib/mock/dashboard";

interface DashboardClientProps {
  userName: string;
  /** Kayıt sırasında girilip veritabanına yazılan gerçek firma adı/logosu —
   * Şirket Ayarları'ndan (tarayıcı localStorage) özelleştirme yapılmadıysa
   * bu değerler kullanılır, boş kalınmaz. */
  registeredCompanyName: string | null;
  registeredLogoUrl: string | null;
  todayServices: TodayServicesSummary;
  openJobs: OpenJobsSummary;
  pendingOffers: PendingOffersSummary;
  pendingCollections: PendingCollectionsSummary;
  criticalRisks: CriticalRisksSummary;
  aiRecommendations: AiRecommendation[];
  recentActivity: ActivityItem[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  pestActivityTrend: PestActivityPoint[];
  auditReadiness: AuditReadiness;
}

export function DashboardClient({
  userName,
  registeredCompanyName,
  registeredLogoUrl,
  todayServices,
  openJobs,
  pendingOffers,
  pendingCollections,
  criticalRisks,
  aiRecommendations,
  recentActivity,
  todayAppointments,
  upcomingAppointments,
  pestActivityTrend,
  auditReadiness,
}: DashboardClientProps) {
  const weatherState = useWeather();
  const exchangeRatesState = useExchangeRates();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    function syncCompanySettings() {
      const settings = getCompanySettings();
      setCompanyName(settings.companyName || null);
      setCompanyLogo(settings.logo);
    }
    syncCompanySettings();
    window.addEventListener("pestshield:company-settings-updated", syncCompanySettings);
    window.addEventListener("storage", syncCompanySettings);
    return () => {
      window.removeEventListener("pestshield:company-settings-updated", syncCompanySettings);
      window.removeEventListener("storage", syncCompanySettings);
    };
  }, []);

  const displayName = companyName || registeredCompanyName || userName;
  const effectiveLogo = companyLogo || registeredLogoUrl;

  const riskItems = [
    { label: "Yüksek Haşere Aktivitesi", value: criticalRisks.highPestActivity, severity: "high" as const },
    { label: "Süresi Geçmiş Kontrol", value: criticalRisks.overdueStationChecks, severity: "high" as const },
    { label: "Eksik Fotoğraf", value: criticalRisks.missingPhotos, severity: "medium" as const },
    { label: "Açık Düzeltici Faaliyet", value: criticalRisks.openCorrectiveActions, severity: "medium" as const },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      <PestBackground />
      <div className="relative z-10 flex flex-col gap-6">
      {/* Top row: welcome + weather mini + exchange rates */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/[0.07] via-card to-card p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          {effectiveLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectiveLogo}
              alt="Firma logosu"
              className="size-16 shrink-0 rounded-xl border border-border/60 bg-white object-contain p-1.5 shadow-sm sm:size-20"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground sm:size-20">
              Logo
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">Hoş geldiniz, {displayName}</h1>
            <p className="text-sm capitalize text-muted-foreground">{formatToday()}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <WeatherWidget state={weatherState} />
          <Separator orientation="vertical" className="hidden h-10 sm:block" />
          <ExchangeRateWidget state={exchangeRatesState} />
          <Separator orientation="vertical" className="hidden h-10 sm:block" />
          <LicenseWidget />
        </div>
      </motion.div>

      {/* KPI cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          title="Bugünkü Servisler"
          icon={CalendarCheck}
          accent="blue"
          delay={0.05}
          stats={[
            { label: "Toplam", value: formatNumber(todayServices.total) },
            { label: "Tamamlanan", value: formatNumber(todayServices.completed), tone: "success" },
            { label: "Bekleyen", value: formatNumber(todayServices.pending), tone: "warning" },
            { label: "Gecikmiş", value: formatNumber(todayServices.delayed), tone: "destructive" },
          ]}
        />
        <KpiCard
          title="Açık İşler"
          icon={ClipboardList}
          accent="purple"
          delay={0.1}
          stats={[
            { label: "Aktif", value: formatNumber(openJobs.active) },
            { label: "Yüksek Öncelik", value: formatNumber(openJobs.highPriority), tone: "destructive" },
            { label: "Onay Bekleyen", value: formatNumber(openJobs.waitingApproval), tone: "warning" },
            { label: "Atanmamış", value: formatNumber(openJobs.unassigned), tone: "warning" },
          ]}
        />
        <KpiCard
          title="Bekleyen Teklifler"
          icon={FileSpreadsheet}
          accent="amber"
          delay={0.15}
          stats={[
            { label: "Toplam Teklif", value: formatNumber(pendingOffers.total) },
            { label: "Teklif Değeri", value: `${formatNumber(pendingOffers.value)} ₺` },
            { label: "Süresi Dolan", value: formatNumber(pendingOffers.expiring), tone: "warning" },
            { label: "Dönüşüm Oranı", value: `%${pendingOffers.conversionRate}`, tone: "success" },
          ]}
        />
        <CollectionSummaryCard
          delay={0.2}
          totalAmount={pendingCollections.totalAmount}
          overdueAmount={pendingCollections.overdueAmount}
          dueThisWeek={pendingCollections.dueThisWeek}
          trend={pendingCollections.trend}
        />
        <RiskCard delay={0.25} items={riskItems} />
      </div>

      {/* Main analytics row */}
      <PestActivityChart data={pestActivityTrend} delay={0.3} />

      {/* AI recommendations + activity feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AiRecommendationCard recommendations={aiRecommendations} delay={0.35} />
        <ActivityFeed items={recentActivity} delay={0.4} />
      </div>

      {/* Calendar + audit readiness + weather detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CalendarWidget today={todayAppointments} upcoming={upcomingAppointments} delay={0.45} />
        <AuditReadinessCard
          score={auditReadiness.score}
          checklist={auditReadiness.checklist}
          delay={0.5}
        />
        <WeatherForecastCard state={weatherState} delay={0.55} />
      </div>
      </div>
    </div>
  );
}
