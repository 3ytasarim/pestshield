import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Box,
  Bug,
  Building2,
  Calendar,
  CalendarClock,
  Camera,
  Contact,
  CreditCard,
  FileBarChart,
  FileCheck,
  FileClock,
  FileSignature,
  FileText,
  FlaskConical,
  HardHat,
  Key,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  MapPin,
  MapPinned,
  MessageSquareText,
  Package,
  PieChart,
  Plug,
  QrCode,
  Receipt,
  Route,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wrench,
  Warehouse,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Menüde görünür ama henüz bağlı bir sayfası yok; tıklanamaz, "Yakında" rozeti gösterir. */
  comingSoon?: boolean;
  /** Bir sayfaya değil, bir uygulama içi eyleme (ör. komut paletini açma) bağlıdır. */
  action?: "open-command-palette";
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  /** Varsayılan olarak açık mı gelsin (ör. en sık kullanılan gruplar). */
  defaultOpen?: boolean;
  items: NavItem[];
}

/**
 * PestShield AI Pest Governance Platformu'nun tam bilgi mimarisi.
 * Sadece "Genel Bakış" ve "Müşteriler" gerçek, çalışan sayfalardır.
 * Geri kalan tüm öğeler ürünün hedeflenen tam kapsamını temsil eder ve
 * "Yakında" olarak işaretlenmiştir — gerçek bir route'a bağlı değildir,
 * tıklanamaz. Bu sayede menü hiyerarşisi eksiksiz görünür ama sahte/kırık
 * bir işlevsellik iddiası taşımaz.
 */
export const NAV_GROUPS_BY_ROLE: Record<Role, NavGroup[]> = {
  ADMIN: [
    {
      label: "Genel",
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [{ label: "Genel Bakış", href: "/dashboard/admin", icon: LayoutDashboard }],
    },
    {
      label: "Sistem",
      icon: Settings,
      defaultOpen: true,
      items: [
        { label: "Firmalar", href: "/dashboard/admin/companies", icon: Building2 },
        { label: "Kullanıcılar", href: "/dashboard/admin/users", icon: Users },
        { label: "Destek Talepleri", href: "/dashboard/admin/support", icon: LifeBuoy },
      ],
    },
  ],
  TECH: [
    {
      label: "Genel",
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [{ label: "Genel Bakış", href: "/dashboard/tech", icon: LayoutDashboard }],
    },
    {
      label: "Operasyon",
      icon: HardHat,
      defaultOpen: true,
      items: [
        { label: "QR Kontrol", href: "/dashboard/tech/scan", icon: QrCode },
        { label: "İstasyonlar", href: "/dashboard/tech/stations", icon: MapPin },
        { label: "Profil", href: "/dashboard/tech/profile", icon: Users },
      ],
    },
  ],
  CLIENT: [
    {
      label: "Genel",
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { label: "Genel Bakış", href: "/dashboard/client", icon: LayoutDashboard },
        { label: "Bildirim Merkezi", href: "/dashboard/client/notifications", icon: Bell },
        { label: "Takvim", href: "/dashboard/client/calendar", icon: Calendar },
        { label: "Destek Mesajları", href: "/dashboard/client/support", icon: LifeBuoy },
      ],
    },
    {
      label: "CRM",
      icon: Users,
      defaultOpen: true,
      items: [
        { label: "Müşteriler", href: "/dashboard/client/customers", icon: Users },
        { label: "Şubeler", href: "/dashboard/client/branches", icon: Building2 },
        { label: "Lokasyonlar", href: "/dashboard/client/locations", icon: MapPin },
        { label: "İletişim Kişileri", href: "/dashboard/client/contacts", icon: Contact },
        { label: "Hizmetler", href: "/dashboard/client/hizmetler", icon: Wrench },
        { label: "Teklifler", href: "/dashboard/client/offers", icon: FileText },
        { label: "Sözleşmeler", href: "/dashboard/client/contracts", icon: FileSignature },
      ],
    },
    {
      label: "Operasyon",
      icon: HardHat,
      items: [
        { label: "İş Emirleri", href: "/dashboard/client/work-orders", icon: ListChecks },
        { label: "Servis Planlama", href: "/dashboard/client/service-planning", icon: CalendarClock },
        { label: "Günlük Rotalar", href: "/dashboard/client/routes", icon: Route },
        { label: "Teknisyenler", href: "/dashboard/client/technicians", icon: HardHat },
        { label: "Araçlar", href: "/dashboard/client/vehicles", icon: Truck },
        { label: "İstasyonlar", href: "/dashboard/client/stations", icon: MapPinned },
        { label: "QR Kontrol", href: "/dashboard/client/qr-check", icon: QrCode },
        { label: "Kontrol Noktaları", href: "/dashboard/client/checkpoints", icon: ListChecks },
      ],
    },
    {
      label: "Pest Yönetimi",
      icon: Bug,
      items: [
        { label: "Zararlı Türleri", href: "/dashboard/client/pest-species", icon: Bug },
        { label: "Kimyasallar", href: "/dashboard/client/chemicals", icon: FlaskConical },
        { label: "Tuzaklar", href: "/dashboard/client/traps", icon: Box },
        { label: "Yemler", href: "/dashboard/client/baits", icon: Package },
        { label: "UV Sistemleri", href: "/dashboard/client/uv-systems", icon: Lightbulb },
        { label: "Feromonlar", href: "/dashboard/client/pheromones", icon: Wind },
      ],
    },
    {
      label: "Envanter",
      icon: Warehouse,
      items: [
        { label: "Ürünler", href: "/dashboard/client/products", icon: ShoppingBag },
        { label: "Depolar", href: "/dashboard/client/warehouses", icon: Warehouse },
        { label: "Stok Hareketleri", href: "/dashboard/client/stock-movements", icon: ArrowLeftRight },
        { label: "Kritik Stok", href: "/dashboard/client/critical-stock", icon: AlertTriangle },
      ],
    },
    {
      label: "Denetim",
      icon: ShieldCheck,
      items: [
        { label: "Audit Center", href: "/dashboard/client/audit-center", icon: ShieldCheck },
        { label: "HACCP", href: "/dashboard/client/haccp", icon: FileCheck },
        { label: "BRCGS", href: "/dashboard/client/brcgs", icon: Award },
        { label: "ISO 22000", href: "/dashboard/client/iso-22000", icon: BadgeCheck },
        { label: "FSSC", href: "/dashboard/client/fssc", icon: FileCheck },
        { label: "Düzeltici Faaliyetler", href: "/dashboard/client/corrective-actions", icon: ShieldAlert },
        { label: "Risk Yönetimi", href: "/dashboard/client/risk-management", icon: AlertOctagon },
      ],
    },
    {
      label: "Finans",
      icon: Wallet,
      items: [
        { label: "Cari Hesap", href: "/dashboard/client/current-account", icon: CreditCard },
        { label: "Tahsilatlar", href: "/dashboard/client/collections", icon: Wallet },
        { label: "Faturalar", href: "/dashboard/client/billing", icon: FileClock },
        { label: "Banka", href: "/dashboard/client/bank-accounts", icon: Landmark },
        { label: "Ödeme Takibi", href: "/dashboard/client/payment-tracking", icon: Receipt },
      ],
    },
    {
      label: "Raporlar",
      icon: BarChart3,
      items: [
        { label: "Operasyon", href: "/dashboard/client/reports/operations", icon: Activity },
        { label: "Finans", href: "/dashboard/client/reports/finance", icon: PieChart },
        { label: "Audit", href: "/dashboard/client/reports/audit", icon: ShieldCheck },
        { label: "AI Analizleri", href: "/dashboard/client/reports/ai", icon: Sparkles },
      ],
    },
    {
      label: "Yapay Zeka",
      icon: Bot,
      items: [
        { label: "AI Copilot", href: "/dashboard/client/ai/copilot", icon: Bot, comingSoon: true },
        { label: "AI Tavsiyeleri", href: "/dashboard/client/ai/recommendations", icon: Lightbulb, comingSoon: true },
        { label: "Fotoğraf Analizi", href: "/dashboard/client/ai/photo-analysis", icon: Camera, comingSoon: true },
        { label: "Risk Tahmini", href: "/dashboard/client/ai/risk-prediction", icon: TrendingUp, comingSoon: true },
        { label: "Otomatik Rapor", href: "/dashboard/client/ai/auto-report", icon: FileBarChart, comingSoon: true },
      ],
    },
    {
      label: "Sistem",
      icon: Settings,
      items: [
        { label: "Kullanıcılar", href: "/dashboard/client/users", icon: Users },
        { label: "Roller", href: "/dashboard/client/roles", icon: Shield },
        { label: "Yetkiler", href: "/dashboard/client/permissions", icon: Key },
        { label: "Entegrasyonlar", href: "/dashboard/client/integrations", icon: Plug },
        { label: "Şirket Ayarları", href: "/dashboard/client/settings", icon: Settings },
        { label: "Belgeler", href: "/dashboard/client/documents", icon: FileText },
        { label: "İçerik Şablonları", href: "/dashboard/client/message-templates", icon: MessageSquareText },
      ],
    },
  ],
  /// Müşteri portalı kendi hafif shell'inde (src/app/dashboard/customer/layout.tsx)
  /// sabit bir sekme çubuğu kullanır — bu liste sadece Record<Role, NavGroup[]>
  /// tip tamlığı için var, DashboardShell/AppSidebar tarafından okunmaz.
  CUSTOMER: [
    {
      label: "Genel",
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { label: "Genel Bakış", href: "/dashboard/customer", icon: LayoutDashboard },
        { label: "Hizmet Geçmişi", href: "/dashboard/customer/work-orders", icon: ListChecks },
        { label: "Faturalar", href: "/dashboard/customer/invoices", icon: FileClock },
        { label: "Sözleşmeler", href: "/dashboard/customer/contracts", icon: FileSignature },
        { label: "Destek", href: "/dashboard/customer/support", icon: LifeBuoy },
      ],
    },
  ],
};

const ALL_NAV_ITEMS = Object.values(NAV_GROUPS_BY_ROLE)
  .flat()
  .flatMap((group) => group.items);

/**
 * CLIENT dashboard'ının tam bilgi mimarisini { group, href, label } olarak
 * düzleştirir — Roller (görünürlük checklist'i) ve Yetkiler (modül matrisi)
 * sayfaları bunu tek doğruluk kaynağı olarak kullanır, hiçbir öğe hariç
 * tutulmaz (Genel grup, Kullanıcılar/Roller/Yetkiler dahil).
 */
export function getClientNavHrefs(): { group: string; href: string; label: string }[] {
  return NAV_GROUPS_BY_ROLE.CLIENT.flatMap((group) =>
    group.items
      .filter((item) => !item.comingSoon)
      .map((item) => ({ group: group.label, href: item.href, label: item.label })),
  );
}

/** Bir path'in müşteri detay sayfası olup olmadığını ve varsa ID'sini döndürür. */
export function matchCustomerDetailPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/client\/customers\/([^/]+)/);
  return match ? match[1] : null;
}

/** Verilen path'e karşılık gelen Türkçe sayfa başlığını döndürür. Müşteri detay sayfaları için gerçek isim ayrıca çözümlenmelidir. */
export function getPageTitle(pathname: string): string {
  if (matchCustomerDetailPath(pathname)) {
    return "Müşteri Detayı";
  }
  return ALL_NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Genel Bakış";
}
