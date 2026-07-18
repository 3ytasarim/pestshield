"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Award, Building2, CheckCircle2, ImagePlus, MapPin, Phone, Save, Stamp, Trash2, UserRound } from "lucide-react";
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

  function handleSave() {
    if (!companyName.trim()) {
      toast.error("Firma adını girin");
      return;
    }
    setSaving(true);
    const next: CompanySettings = {
      companyName: companyName.trim(),
      authorizedName: authorizedName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      logo,
      updatedAt: new Date().toISOString(),
    };
    saveCompanySettings(next);
    setSettings(next);
    setSaving(false);
    toast.success("Şirket ayarları kaydedildi");
    window.dispatchEvent(new Event("pestshield:company-settings-updated"));
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
    </div>
  );
}
