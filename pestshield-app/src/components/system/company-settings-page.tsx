"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Award, Building2, CheckCircle2, ImagePlus, KeyRound, MapPin, Phone, Save, Stamp, Trash2, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import {
  getCompanySettings,
  readLogoFile,
  saveCompanySettings,
  type CompanySettings,
} from "@/lib/company-settings";
import {
  getCertificateTemplate,
  readSealFile,
  saveCertificateTemplate,
  type CertificateStyle,
  type CertificateTemplateSettings,
} from "@/lib/certificate-templates";
import { cn } from "@/lib/utils";

const CERTIFICATE_STYLES: { value: CertificateStyle; label: string; preview: string }[] = [
  { value: "gold-ribbon", label: "Altın Kurdela", preview: "linear-gradient(160deg, #0a1e3d 0%, #123258 45%, #0a1e3d 100%)" },
  { value: "green-frame", label: "Yeşil Çerçeve", preview: "linear-gradient(160deg, #0f5132 0%, #14532d 45%, #0f5132 100%)" },
];

export function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(() => getCompanySettings());
  const [companyName, setCompanyName] = useState(() => getCompanySettings().companyName);
  const [authorizedName, setAuthorizedName] = useState(() => getCompanySettings().authorizedName);
  const [address, setAddress] = useState(() => getCompanySettings().address);
  const [phone, setPhone] = useState(() => getCompanySettings().phone);
  const [logo, setLogo] = useState<string | null>(() => getCompanySettings().logo);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certTemplate, setCertTemplate] = useState<CertificateTemplateSettings>(() => getCertificateTemplate());
  const [certStyle, setCertStyle] = useState<CertificateStyle>(() => getCertificateTemplate().style);
  const [sealImage, setSealImage] = useState<string | null>(() => getCertificateTemplate().sealImage);
  const [savingCert, setSavingCert] = useState(false);
  const sealInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Firma bilgileri hesaba (veritabanına) bağlı - her cihaz/tarayıcıda aynı
  // görünmesi için sayfa açılışında sunucudan çekilir. Mevcut PDF üretim
  // kodları senkron olarak localStorage okuduğu için, sunucudan gelen veri
  // localStorage'a da yazılır (bkz. saveCompanySettings).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/company-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<CompanySettings> | null) => {
        if (!data || cancelled) return;
        const next: CompanySettings = {
          companyName: data.companyName ?? "",
          authorizedName: data.authorizedName ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          logo: data.logo ?? null,
          updatedAt: (data.updatedAt as unknown as string) ?? null,
        };
        saveCompanySettings(next);
        setSettings(next);
        setCompanyName(next.companyName);
        setAuthorizedName(next.authorizedName);
        setAddress(next.address);
        setPhone(next.phone);
        setLogo(next.logo);
      })
      .catch(() => {
        // Sunucudan çekilemezse localStorage'daki (varsa) son bilinen değerler kalır.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrl = await readLogoFile(file);
      setLogo(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo yüklenemedi");
    }
  }

  function handleRemoveLogo() {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!companyName.trim()) {
      toast.error("Firma adını girin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/company-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          authorizedName: authorizedName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          logo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Kaydedilemedi");
      }
      const data = await res.json();
      const next: CompanySettings = {
        companyName: data.companyName ?? "",
        authorizedName: data.authorizedName ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        logo: data.logo ?? null,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      };
      saveCompanySettings(next);
      setSettings(next);
      toast.success("Şirket ayarları kaydedildi");
      window.dispatchEvent(new Event("pestshield:company-settings-updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Tüm şifre alanlarını doldurun");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Yeni şifre en az 8 karakter olmalıdır");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message ?? "Şifre değiştirilemedi");
      }
      toast.success("Şifreniz güncellendi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre değiştirilemedi");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSealSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrl = await readSealFile(file);
      setSealImage(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Görsel yüklenemedi");
    }
  }

  function handleRemoveSeal() {
    setSealImage(null);
    if (sealInputRef.current) sealInputRef.current.value = "";
  }

  function handleSaveCertTemplate() {
    setSavingCert(true);
    const next: CertificateTemplateSettings = {
      style: certStyle,
      sealImage,
      updatedAt: new Date().toISOString(),
    };
    saveCertificateTemplate(next);
    setCertTemplate(next);
    setSavingCert(false);
    toast.success("Belge şablonu kaydedildi");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Şirket Ayarları</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Firma logonuzu ve yetkili bilgilerinizi girin — logo panel karşılama ekranında ve oluşturduğunuz tüm PDF
          belgelerinde (cari ekstre, teklif, iş emri raporu) görünür.
        </p>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Firma Kimliği</p>
              <p className="text-xs text-muted-foreground">Bu bilgiler panelinizde ve belgelerinizde kullanılır.</p>
            </div>
            {settings.updatedAt && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <CheckCircle2 className="size-3" />
                Kayıtlı · {formatDate(settings.updatedAt)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-2.5">
              <div
                className={cn(
                  "flex size-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30",
                  logo && "border-solid border-primary/20 bg-white",
                )}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Firma logosu" className="size-full object-contain p-2" />
                ) : (
                  <ImagePlus className="size-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  {logo ? "Değiştir" : "Logo Yükle"}
                </Button>
                {logo && (
                  <Button size="icon-sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleRemoveLogo} aria-label="Logoyu kaldır">
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoSelect(e.target.files?.[0])}
              />
              <p className="text-center text-[10px] text-muted-foreground">PNG, JPG veya SVG · maks. 5MB</p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-1.5">Firma Adı</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Örn. ABC Liman A.Ş." className="h-11 rounded-xl px-3.5" />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  Yetkili Adı ve Soyadı
                </Label>
                <Input
                  value={authorizedName}
                  onChange={(e) => setAuthorizedName(e.target.value)}
                  placeholder="Örn. Ayşe Yılmaz"
                  className="h-11 rounded-xl px-3.5"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  PDF belgelerinizin imza bölümünde bu isim yazılır.
                </p>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Açık Adres
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Örn. İstasyon Mahallesi İstasyon Caddesi No:4"
                  className="h-11 rounded-xl px-3.5"
                />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Telefon
                </Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(532) 000-0000" className="h-11 rounded-xl px-3.5" />
              </div>
              <p className="text-[11px] text-muted-foreground sm:col-span-2">
                Adres ve telefon, EK-1 Biyosidal Ürün Uygulama İşlem Formu&apos;nda &quot;Uygulamayı Yapana Ait Bilgiler&quot; bölümüne otomatik yazılır.
              </p>
            </div>
          </div>

          <Button onClick={handleSave} loading={saving} className="w-fit">
            <Save className="size-4" />
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ürün Uygulama Belgesi Şablonu</p>
              <p className="text-xs text-muted-foreground">Müşterileriniz için oluşturduğunuz sertifika tasarımını seçin.</p>
            </div>
            {certTemplate.updatedAt && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <CheckCircle2 className="size-3" />
                Kayıtlı · {formatDate(certTemplate.updatedAt)}
              </span>
            )}
          </div>

          <div>
            <Label className="mb-2">Tasarım</Label>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {CERTIFICATE_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setCertStyle(s.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-left transition-colors",
                    certStyle === s.value ? "border-primary bg-primary/5" : "border-border/60 hover:border-border",
                  )}
                >
                  <div className="h-16 w-full rounded-lg" style={{ background: s.preview }} />
                  <span className="flex w-full items-center justify-between text-xs font-medium text-foreground">
                    {s.label}
                    {certStyle === s.value && <CheckCircle2 className="size-3.5 text-primary" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Label className="flex items-center gap-1.5">
              <Stamp className="size-3.5 text-muted-foreground" />
              Mühür / Onay Görseli (opsiyonel)
            </Label>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30",
                  sealImage && "border-solid border-primary/20 bg-white",
                )}
              >
                {sealImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sealImage} alt="Mühür" className="size-full object-contain p-2" />
                ) : (
                  <Stamp className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => sealInputRef.current?.click()}>
                    {sealImage ? "Değiştir" : "Görsel Yükle"}
                  </Button>
                  {sealImage && (
                    <Button size="icon-sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleRemoveSeal} aria-label="Görseli kaldır">
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <p className="max-w-xs text-[11px] text-muted-foreground">
                  Belgede &ldquo;RUHSATLI VE ONAYLIDIR&rdquo; yazısının üzerinde gösterilir. Bu alana istediğiniz mühür, damga
                  veya onay görselini kendiniz seçip yükleyebilirsiniz — boş bırakılırsa görsel alanı gizlenir.
                </p>
              </div>
              <input
                ref={sealInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSealSelect(e.target.files?.[0])}
              />
            </div>
          </div>

          <Button onClick={handleSaveCertTemplate} loading={savingCert} className="w-fit">
            <Save className="size-4" />
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Şifre Değiştir</p>
              <p className="text-xs text-muted-foreground">Hesabınızın giriş şifresini güncelleyin.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:max-w-md">
            <div>
              <Label className="mb-1.5">Mevcut Şifre</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 rounded-xl px-3.5"
              />
            </div>
            <div>
              <Label className="mb-1.5">Yeni Şifre</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11 rounded-xl px-3.5"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">En az 8 karakter.</p>
            </div>
            <div>
              <Label className="mb-1.5">Yeni Şifre (Tekrar)</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11 rounded-xl px-3.5"
              />
            </div>
          </div>

          <Button onClick={handleChangePassword} loading={changingPassword} className="w-fit">
            <KeyRound className="size-4" />
            Şifreyi Güncelle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
