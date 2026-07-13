"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Printer } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechnicianMultiSelect } from "@/components/crm/technician-multiselect";
import { getCompanySettings } from "@/lib/company-settings";
import { technicians } from "@/lib/mock/operations";
import { customers } from "@/lib/mock/crm";
import { printBiyosidalUygulamaRaporu, type BiyosidalRaporFormValues } from "@/lib/pdf/biyosidal-uygulama-raporu";

const TECHNICIAN_OPTIONS = technicians.filter((t) => t.status === "active").map((t) => t.name);

function buildDefaultForm(): BiyosidalRaporFormValues {
  const company = getCompanySettings();
  return {
    uygulayanFirmaAdi: company.companyName || "",
    acikAdresi: company.address || "",
    mesulMudur: "",
    uygulayicilar: "",
    telefon: company.phone || "",
    izinTarihSayisi: "",
    ekipSorumlusu: "",
    urunTicariAdi: "",
    urunUygulamaSekli: "",
    urunAktifMaddesi: "",
    urunAntidotu: "",
    urunAmbalajMiktari: "",
    hedefZararliTuru: "",
    uygulamaTarihi: "",
    baslangicSaati: "",
    bitisSaati: "",
    meskenIsyeriVb: "",
    meskenDaireSayisi: "",
    uygulamaAlani: "",
    uygulamaAlaniBirimi: "m2",
    guvenlikOnlemleri: "",
  };
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="border-b border-border/60 bg-success/10 px-4 py-2.5">
        <span className="text-sm font-semibold text-success">{title}</span>
      </div>
      <div className="flex flex-col gap-3.5 p-4">{children}</div>
    </div>
  );
}

function BoxField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 rounded-xl px-3.5" />
    </div>
  );
}

export function ChemicalUsageReportPage() {
  const [form, setForm] = useState<BiyosidalRaporFormValues>(() => buildDefaultForm());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const uygulamaYeriAdresi = useMemo(
    () => (customer ? [customer.addressLine, customer.district, customer.city].filter(Boolean).join(", ") : ""),
    [customer],
  );

  function update(patch: Partial<BiyosidalRaporFormValues>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handlePrint() {
    setPrinting(true);
    try {
      await printBiyosidalUygulamaRaporu(form, uygulamaYeriAdresi, customer?.companyName ?? "—");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
          <FlaskConical className="size-7 text-primary" />
          Biyosidal Ürün Kullanım Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          EK-1 Biyosidal Ürün Uygulama İşlem Formu ile aynı alan yapısında, hızlıca doldurup yazdırabileceğiniz bağımsız bir uygulama raporu.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" loading={printing} onClick={handlePrint}>
            <Printer className="size-3.5" />
            Yazdır
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Box title="Uygulamayı Yapana Ait Bilgiler">
            <BoxField label="Uygulamayı Yapan Firma Adı" value={form.uygulayanFirmaAdi} onChange={(v) => update({ uygulayanFirmaAdi: v })} />
            <BoxField label="Açık Adresi" value={form.acikAdresi} onChange={(v) => update({ acikAdresi: v })} />
            <div>
              <Label className="mb-1.5">Mesul Müdür</Label>
              <Select value={form.mesulMudur || undefined} onValueChange={(v) => update({ mesulMudur: String(v) })}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                  <SelectValue placeholder="Seçiniz…">{() => form.mesulMudur || "Seçiniz…"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TECHNICIAN_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TechnicianMultiSelect
              label="Uygulayıcı(lar) Adı, Soyadı"
              value={form.uygulayicilar}
              onChange={(v) => update({ uygulayicilar: v })}
              options={TECHNICIAN_OPTIONS}
            />
            <BoxField label="Telefon" value={form.telefon} onChange={(v) => update({ telefon: v })} />
            <BoxField label="Müdürlük İzin Tarih ve Sayısı" value={form.izinTarihSayisi} onChange={(v) => update({ izinTarihSayisi: v })} />
            <div>
              <Label className="mb-1.5">Ekip Sorumlusu</Label>
              <Select value={form.ekipSorumlusu || undefined} onValueChange={(v) => update({ ekipSorumlusu: String(v) })}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                  <SelectValue placeholder="Seçiniz…">{() => form.ekipSorumlusu || "Seçiniz…"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TECHNICIAN_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Box>

          <Box title="Kullanılan Biyosidal Ürüne Ait Bilgiler">
            <BoxField label="Ürünün Ticari Adı, Ruhsat Tarih ve Sayısı" value={form.urunTicariAdi} onChange={(v) => update({ urunTicariAdi: v })} />
            <BoxField label="Ürünün Uygulama Şekli" value={form.urunUygulamaSekli} onChange={(v) => update({ urunUygulamaSekli: v })} />
            <BoxField label="Ürünün Aktif Maddesi" value={form.urunAktifMaddesi} onChange={(v) => update({ urunAktifMaddesi: v })} />
            <BoxField label="Ürünün Antidotu" value={form.urunAntidotu} onChange={(v) => update({ urunAntidotu: v })} />
            <BoxField label="Ürünün Ambalajının Miktarı (kg/litre)" value={form.urunAmbalajMiktari} onChange={(v) => update({ urunAmbalajMiktari: v })} />
          </Box>

          <Box title="Uygulama Yapılan Yer Hakkında Bilgiler">
            <div>
              <Label className="mb-1.5">Uygulama Yapılan Yerin Açık Adresi</Label>
              <Select value={customerId ?? undefined} onValueChange={(v) => setCustomerId(String(v))}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                  <SelectValue placeholder="Müşteri seçiniz…">{() => uygulamaYeriAdresi || "Müşteri seçiniz…"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <BoxField label="Uygulama Yapılan Hedef Zararlı Türü/Adı" value={form.hedefZararliTuru} onChange={(v) => update({ hedefZararliTuru: v })} />
            <div>
              <Label className="mb-1.5">Uygulama Tarihi, Başlangıç ve Bitiş Saati</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="date" value={form.uygulamaTarihi} onChange={(e) => update({ uygulamaTarihi: e.target.value })} className="h-11 rounded-xl px-2.5" />
                <Input type="time" value={form.baslangicSaati} onChange={(e) => update({ baslangicSaati: e.target.value })} className="h-11 rounded-xl px-2.5" />
                <Input type="time" value={form.bitisSaati} onChange={(e) => update({ bitisSaati: e.target.value })} className="h-11 rounded-xl px-2.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <BoxField label="Mesken/İşyeri vb." value={form.meskenIsyeriVb} onChange={(v) => update({ meskenIsyeriVb: v })} />
              <BoxField label="Mesken İse Daire Sayısı" value={form.meskenDaireSayisi} onChange={(v) => update({ meskenDaireSayisi: v })} />
            </div>
            <BoxField label="Uygulama Yapılan Yerin Alanı" value={form.uygulamaAlani} onChange={(v) => update({ uygulamaAlani: v })} placeholder="Örn. 200 m2" />
            <div>
              <Label className="mb-1.5">Alınan Güvenlik Önlemleri, Yapılan Öneri ve Uyarılar</Label>
              <Textarea
                value={form.guvenlikOnlemleri}
                onChange={(e) => update({ guvenlikOnlemleri: e.target.value })}
                className="min-h-[72px] rounded-xl px-3.5 py-2.5"
              />
            </div>
          </Box>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" loading={printing} onClick={handlePrint}>
            <Printer className="size-3.5" />
            Yazdır
          </Button>
        </div>
      </Card>
    </div>
  );
}
