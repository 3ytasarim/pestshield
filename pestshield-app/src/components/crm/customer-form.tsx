"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Download, ImagePlus, KeyRound, MapPin, QrCode, Trash2, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { QrCodeImage } from "@/components/operations/qr-code-image";
import { printApplicationCertificate, printHygienePoster, printQrLabel } from "@/lib/pdf/customer-documents";
import type { Customer } from "@/lib/mock/crm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TextField,
  SelectField,
  CheckboxField,
  ToggleField,
  PasswordField,
  FormSectionCard,
} from "@/components/crm/form-fields";
import { customerFormSchema, type CustomerFormValues } from "@/lib/validations/crm";
import {
  SECTOR_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
} from "@/components/crm/crm-labels";
import { TR_CITY_LIST, districtsOf } from "@/lib/tr-locations";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CustomerFormValues) => void;
  defaultValues?: CustomerFormValues;
  /** Düzenlenen müşterinin tam kaydı — yalnızca "Uygulama QR Kodu" panelinde (id, vb. alanlar için) kullanılır. */
  customer?: Customer | null;
}

const EMPTY_DEFAULTS: CustomerFormValues = {
  companyName: "",
  taxNumber: "",
  taxOffice: "",
  sector: "",
  customerType: "Bireysel",
  isPotential: false,
  status: "active",
  shortName: "",
  logo: null,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactTitle: "",
  fax: "",
  country: "Türkiye",
  city: "",
  district: "",
  addressLine: "",
  postalCode: "",
  accountCode: "",
  paymentTermDays: 30,
  invoiceEmail: "",
  currency: "TRY",
  iban: "",
  portalEmail: "",
  portalPassword: "",
  sendServiceReportEmail: true,
  sendTrendAnalysisEmail: true,
  sendCorrectiveActionEmail: true,
};

export function CustomerForm({ open, onOpenChange, onSubmit, defaultValues, customer }: CustomerFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ?? EMPTY_DEFAULTS,
  });

  const customerType = useWatch({ control, name: "customerType" });
  const isKurumsal = customerType === "Kurumsal";
  const logo = useWatch({ control, name: "logo" });
  const city = useWatch({ control, name: "city" });
  const isEditMode = !!defaultValues;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const districtOptions = toOptions(districtsOf(city));
  const previousCityRef = useRef<string>(defaultValues?.city ?? "");

  async function handleGenerateDoc(key: string, generator: (c: Customer) => Promise<void>) {
    if (!customer) return;
    setGeneratingDoc(key);
    try {
      await generator(customer);
    } catch {
      toast.error("Belge oluşturulamadı, tekrar deneyin");
    } finally {
      setGeneratingDoc(null);
    }
  }

  useEffect(() => {
    if (open) {
      const nextDefaults = defaultValues ?? EMPTY_DEFAULTS;
      reset(nextDefaults);
      previousCityRef.current = nextDefaults.city;
    }
  }, [open, defaultValues, reset]);

  // Şehir kullanıcı tarafından değiştirildiğinde İlçe'yi sıfırla (formun ilk
  // yüklenmesinde/reset'te tetiklenmemesi için önceki şehir ref'i ile karşılaştırılır).
  useEffect(() => {
    if (previousCityRef.current !== city) {
      setValue("district", "");
      previousCityRef.current = city;
    }
  }, [city, setValue]);

  async function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin (PNG, JPG)");
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setValue("logo", dataUrl, { shouldDirty: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo yüklenemedi");
    }
  }

  function handleRemoveLogo() {
    setValue("logo", null, { shouldDirty: true });
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function submit(values: CustomerFormValues) {
    onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-[760px]">
        <SheetHeader className="gap-1 border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {defaultValues ? "Müşteriyi Düzenle" : "Yeni Müşteri Oluştur"}
          </SheetTitle>
          <SheetDescription>
            Firma, yetkili, adres, finans ve üyelik bilgilerini girin.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 px-6 py-5">
              <FormSectionCard icon={Building2} title="Firma Bilgileri" description="Firmanın resmi kayıt bilgileri">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 text-[13px] font-medium text-foreground/80">Müşteri Logo</Label>
                  {isEditMode ? (
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30",
                          logo && "border-solid border-primary/20 bg-white",
                        )}
                      >
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt="Müşteri logosu" className="size-full object-contain p-1.5" />
                        ) : (
                          <ImagePlus className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1.5">
                          <Button type="button" size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                            {logo ? "Değiştir" : "Dosya Seç 500px / 500px"}
                          </Button>
                          {logo && (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={handleRemoveLogo}
                              aria-label="Logoyu kaldır"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">PNG veya JPG · maks. 5MB</p>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                      />
                    </div>
                  ) : (
                    <p className="rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs text-primary">
                      Kaydı oluşturduktan sonra müşteri logosunu düzenleme ekranından yükleyebilirsiniz.
                    </p>
                  )}
                </div>
                <TextField
                  label="Firma Adı"
                  required
                  className="sm:col-span-2"
                  registration={register("companyName")}
                  error={errors.companyName?.message}
                />
                <TextField
                  label="Müşteri Kısa Adı"
                  required
                  registration={register("shortName")}
                  error={errors.shortName?.message}
                />
                <SelectField
                  label="Sektör"
                  required
                  name="sector"
                  control={control}
                  options={toOptions(SECTOR_OPTIONS)}
                  error={errors.sector?.message}
                />
                <SelectField
                  label="Müşteri Tipi"
                  required
                  name="customerType"
                  control={control}
                  options={toOptions(CUSTOMER_TYPE_OPTIONS)}
                  error={errors.customerType?.message}
                />
                <CheckboxField
                  label="Potansiyel Müşteri (henüz anlaşma yapılmadı)"
                  name="isPotential"
                  control={control}
                  className="sm:col-span-2"
                />
                {isKurumsal && (
                  <>
                    <TextField
                      label="Vergi Numarası"
                      required
                      registration={register("taxNumber")}
                      error={errors.taxNumber?.message}
                    />
                    <TextField
                      label="Vergi Dairesi"
                      required
                      registration={register("taxOffice")}
                      error={errors.taxOffice?.message}
                    />
                  </>
                )}
                <SelectField
                  label="Müşteri Durumu"
                  required
                  name="status"
                  control={control}
                  options={[
                    { value: "active", label: "Aktif" },
                    { value: "passive", label: "Pasif" },
                  ]}
                  error={errors.status?.message}
                />
              </FormSectionCard>

              <FormSectionCard icon={UserRound} title="Yetkili Bilgileri" description="İletişim kurulacak sorumlu kişi">
                <TextField
                  label="Sorumlu Kişi Ad Soyad"
                  required
                  className="sm:col-span-2"
                  registration={register("contactName")}
                  error={errors.contactName?.message}
                />
                <TextField
                  label="Yetkili Telefon"
                  required
                  placeholder="0532 000 00 00"
                  registration={register("contactPhone")}
                  error={errors.contactPhone?.message}
                />
                <TextField
                  label="E-posta"
                  required
                  type="email"
                  placeholder="ornek@firma.com"
                  registration={register("contactEmail")}
                  error={errors.contactEmail?.message}
                />
                <TextField
                  label="Görev / Ünvan"
                  required
                  className="sm:col-span-2"
                  registration={register("contactTitle")}
                  error={errors.contactTitle?.message}
                />
                <TextField
                  label="Faks"
                  placeholder="0212 000 00 00"
                  registration={register("fax")}
                  error={errors.fax?.message}
                />
              </FormSectionCard>

              <FormSectionCard icon={MapPin} title="Adres Bilgileri" description="Hizmet verilecek ana adres">
                <TextField label="Ülke" required registration={register("country")} error={errors.country?.message} />
                <SelectField
                  label="Şehir"
                  required
                  name="city"
                  control={control}
                  options={toOptions(TR_CITY_LIST)}
                  error={errors.city?.message}
                />
                <SelectField
                  label="İlçe"
                  required
                  name="district"
                  control={control}
                  options={districtOptions}
                  placeholder={city ? "Seçiniz" : "Önce şehir seçin"}
                  error={errors.district?.message}
                />
                <TextField
                  label="Posta Kodu"
                  required
                  registration={register("postalCode")}
                  error={errors.postalCode?.message}
                />
                <TextField
                  label="Açık Adres"
                  required
                  className="sm:col-span-2"
                  registration={register("addressLine")}
                  error={errors.addressLine?.message}
                />
              </FormSectionCard>

              <FormSectionCard icon={Wallet} title="Finans Bilgileri" description="Cari hesap ve fatura ayarları">
                <TextField
                  label="Cari Kodu"
                  required
                  registration={register("accountCode")}
                  error={errors.accountCode?.message}
                />
                <TextField
                  label="Ödeme Vadesi (Gün)"
                  required
                  type="number"
                  registration={register("paymentTermDays", { valueAsNumber: true })}
                  error={errors.paymentTermDays?.message}
                />
                <TextField
                  label="Fatura E-posta Adresi"
                  required
                  type="email"
                  registration={register("invoiceEmail")}
                  error={errors.invoiceEmail?.message}
                />
                <SelectField
                  label="Para Birimi"
                  required
                  name="currency"
                  control={control}
                  options={toOptions(CURRENCY_OPTIONS)}
                  error={errors.currency?.message}
                />
                <TextField
                  label="IBAN"
                  className="sm:col-span-2"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  registration={register("iban")}
                  error={errors.iban?.message}
                />
              </FormSectionCard>

              <FormSectionCard icon={KeyRound} title="Üyelik Bilgileri" description="Müşteri portalı giriş ve otomatik e-posta ayarları">
                <TextField
                  label="E-Posta"
                  required
                  className="sm:col-span-2"
                  type="email"
                  registration={register("portalEmail")}
                  error={errors.portalEmail?.message}
                />
                <PasswordField
                  label="Parola"
                  className="sm:col-span-2"
                  registration={register("portalPassword")}
                  error={errors.portalPassword?.message}
                />
                <ToggleField
                  label="Ek1 Maili Gönder"
                  description="Saha personeli raporları otomatik müşteriye iletilir."
                  name="sendServiceReportEmail"
                  control={control}
                  className="sm:col-span-2"
                />
                <ToggleField
                  label="Trend Analiz Rapor Maili Gönder"
                  description="Açıkken, her ayın 1. günü bu müşteriye o ayın trend analiz raporu e-posta ile gönderilir."
                  name="sendTrendAnalysisEmail"
                  control={control}
                  className="sm:col-span-2"
                />
                <ToggleField
                  label="Düzeltici/Teknik Rapor Maili Gönder"
                  description="Açıkken, bu müşteriye ait teknik rapor veya düzeltici önleyici faaliyet raporu oluşturulduğunda rapor bilgisi e-posta ile gönderilir."
                  name="sendCorrectiveActionEmail"
                  control={control}
                  className="sm:col-span-2"
                />
              </FormSectionCard>

              {isEditMode && customer && (
                <FormSectionCard icon={QrCode} title="Uygulama QR Kodu" description="Müşteriye ait yazdırılabilir belgeler">
                  <div className="flex flex-col items-center gap-3 sm:col-span-2">
                    <QrCodeImage
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/client/customers/${customer.id}?tab=work-history`}
                      size={140}
                    />
                    <div className="flex w-full flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start"
                        loading={generatingDoc === "qr-label"}
                        onClick={() => handleGenerateDoc("qr-label", printQrLabel)}
                      >
                        <Download className="size-3.5" />
                        QR Kod Etiketi İndir
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start"
                        loading={generatingDoc === "application-cert"}
                        onClick={() => handleGenerateDoc("application-cert", printApplicationCertificate)}
                      >
                        <Download className="size-3.5" />
                        Ürün Uygulama Belgesi İndir
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start"
                        loading={generatingDoc === "hygiene-poster"}
                        onClick={() => handleGenerateDoc("hygiene-poster", printHygienePoster)}
                      >
                        <Download className="size-3.5" />
                        Müşteri Hijyen Takip Sistemi Afişi İndir
                      </Button>
                    </div>
                  </div>
                </FormSectionCard>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="flex-col gap-3 border-t border-border/60 bg-card/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="order-2 text-muted-foreground sm:order-1"
              onClick={() => toast.info("Taslak kaydetme yakında eklenecek")}
            >
              Taslak olarak kaydet
            </Button>
            <div className="order-1 flex items-center gap-2 sm:order-2">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
                Vazgeç
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1 sm:flex-none">
                Müşteriyi Kaydet
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
