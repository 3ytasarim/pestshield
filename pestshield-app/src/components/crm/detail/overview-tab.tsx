import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  StickyNote,
  User,
  UserPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { CustomerTypeBadge, PotentialBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { ActivityItem, ActivityType, Customer } from "@/lib/mock/crm";

const ACTIVITY_ICON: Record<ActivityType, typeof ClipboardList> = {
  service_completed: ClipboardList,
  offer_sent: FileText,
  contract_uploaded: FileText,
  payment_received: CircleDollarSign,
  note_added: StickyNote,
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function OverviewTab({ customer }: { customer: Customer }) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [hasPortalAccess, setHasPortalAccess] = useState(customer.userId !== null);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalEmail, setPortalEmail] = useState(customer.contactEmail || customer.portalEmail);
  const [portalPassword, setPortalPassword] = useState("");
  const [portalSaving, setPortalSaving] = useState(false);
  const riskOpenCount = customer.riskLevel === "critical" ? 4 : customer.riskLevel === "high" ? 3 : customer.riskLevel === "medium" ? 1 : 0;

  useEffect(() => {
    fetch(`/api/crm/customers/${customer.id}/activity`)
      .then((res) => res.json())
      .then((data) => setActivity(data.activity ?? []))
      .catch(() => setActivity([]));
  }, [customer.id]);

  async function handleGrantPortalAccess() {
    setPortalSaving(true);
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/portal-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: portalEmail, password: portalPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Portal erişimi verilemedi");
        return;
      }
      toast.success("Müşteri portalı erişimi verildi");
      setHasPortalAccess(true);
      setPortalDialogOpen(false);
      setPortalPassword("");
    } finally {
      setPortalSaving(false);
    }
  }

  async function handleRevokePortalAccess() {
    if (!window.confirm("Müşterinin portal erişimi kaldırılsın mı?")) return;
    const res = await fetch(`/api/crm/customers/${customer.id}/portal-access`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message ?? "Portal erişimi kaldırılamadı");
      return;
    }
    toast.success("Portal erişimi kaldırıldı");
    setHasPortalAccess(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-4 text-primary" />
            </div>
            <CardTitle>Müşteri Bilgileri</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <InfoRow icon={Building2} label="Vergi No" value={customer.taxNumber} />
          <InfoRow icon={Building2} label="Vergi Dairesi" value={customer.taxOffice} />
          <InfoRow icon={Building2} label="Sektör" value={customer.sector} />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-3.5" />
              Müşteri Tipi
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              <CustomerTypeBadge type={customer.customerType} />
              {customer.isPotential && <PotentialBadge />}
            </div>
          </div>
          <InfoRow icon={MapPin} label="Adres" value={`${customer.district}, ${customer.city}`} />
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600/10">
              <User className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle>Yetkili Bilgileri</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <InfoRow icon={User} label="Ad Soyad" value={customer.contactName} />
          <InfoRow icon={UserPlus} label="Görev" value={customer.contactTitle} />
          <InfoRow icon={Phone} label="Telefon" value={customer.contactPhone} />
          <InfoRow icon={Mail} label="E-posta" value={customer.contactEmail} />
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Operasyon Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <InfoRow icon={ClipboardList} label="Hizmet Türü" value={customer.serviceType} />
          <InfoRow icon={Calendar} label="Servis Periyodu" value={customer.servicePeriod} />
          <InfoRow icon={User} label="Operasyon Sorumlusu" value={customer.operationsManager} />
          <InfoRow icon={User} label="Satış Temsilcisi" value={customer.salesRep} />
          <InfoRow icon={Calendar} label="Son / Sonraki Servis" value={`${formatDate(customer.lastServiceDate)} → ${formatDate(customer.nextServiceDate)}`} />
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600/10">
              <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Finans Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <InfoRow icon={Wallet} label="Cari Kodu" value={customer.accountCode} />
          <InfoRow icon={Calendar} label="Ödeme Vadesi" value={`${customer.paymentTermDays} gün`} />
          <InfoRow icon={Mail} label="Fatura E-postası" value={customer.invoiceEmail} />
          <InfoRow
            icon={CircleDollarSign}
            label="Bekleyen Tahsilat"
            value={formatCurrency(customer.pendingCollection, customer.currency)}
          />
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldAlert className="size-4 text-destructive" />
            </div>
            <CardTitle>Risk Özeti</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <InfoRow icon={ShieldAlert} label="Pest Risk Skoru" value={String(customer.riskScore)} />
          <InfoRow icon={AlertTriangle} label="Açık Risk Sayısı" value={String(riskOpenCount)} />
          <InfoRow icon={Calendar} label="Geciken İstasyon Kontrolü" value={riskOpenCount > 1 ? "Var" : "Yok"} />
          <InfoRow icon={ClipboardList} label="Açık Düzeltici Faaliyet" value={riskOpenCount > 0 ? String(riskOpenCount) : "Yok"} />
          <InfoRow
            icon={FileText}
            label="Eksik Fotoğraf/Rapor"
            value={customer.auditReadinessScore < 70 ? "Eksik var" : "Tamamlanmış"}
          />
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600/10">
              <KeyRound className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Müşteri Portalı</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Erişim Durumu</span>
            <Badge
              variant="outline"
              className={hasPortalAccess ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : undefined}
            >
              {hasPortalAccess ? "Aktif" : "Kapalı"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Müşteri kendi giriş bilgileriyle hizmet geçmişini, faturalarını, sözleşmelerini görebilir ve destek talebi açabilir.
          </p>
          {hasPortalAccess ? (
            <Button type="button" variant="outline" size="sm" className="w-fit text-destructive hover:bg-destructive/10" onClick={handleRevokePortalAccess}>
              Erişimi Kaldır
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setPortalDialogOpen(true)}>
              Portal Erişimi Ver
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz aktivite bulunmuyor.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((item) => {
                const Icon = ACTIVITY_ICON[item.type];
                return (
                  <li key={item.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="size-3.5 text-primary" />
                    </span>
                    <div>
                      <p className="text-foreground/90">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4.5 text-primary" />
              Portal Erişimi Ver
            </DialogTitle>
            <DialogDescription>Müşteri bu bilgilerle kendi portalına giriş yapabilecek.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5">
            <div>
              <Label className="mb-1.5">E-posta</Label>
              <Input
                type="email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="musteri@ornek.com"
                className="h-11 rounded-xl px-3.5"
              />
            </div>
            <div>
              <Label className="mb-1.5">Şifre</Label>
              <Input
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                placeholder="En az 8 karakter"
                className="h-11 rounded-xl px-3.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPortalDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button type="button" loading={portalSaving} onClick={handleGrantPortalAccess}>
              <KeyRound className="size-4" />
              Erişim Ver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
