"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateLong } from "@/components/crm/crm-format";
import { SignaturePad } from "@/components/crm/signature-pad";
import { TechnicianMultiSelect } from "@/components/crm/technician-multiselect";
import { printEk1Form } from "@/lib/pdf/ek1-report";
import { getCompanySettings } from "@/lib/company-settings";
import type { Ek1Form, PeriyotOccurrence } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

export interface Ek1CustomerInfo {
  companyName: string;
  addressLine: string;
  district: string;
  city: string;
  contactName: string;
}

interface Ek1DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: PeriyotOccurrence | null;
  customerId: string | null;
  batchName: string;
  onSaved?: () => void;
}

export function summarizeBiocidalUsages(occurrence: PeriyotOccurrence): string {
  return (occurrence.biocidalProductUsages ?? [])
    .filter((u) => u.productName)
    .map((u) => `${u.productName}${u.amount ? ` - ${u.amount}${u.unit}` : ""}`)
    .join(", ");
}

export function buildDefaultEk1Form(occurrence: PeriyotOccurrence, customer: Ek1CustomerInfo | null): Ek1Form {
  const company = getCompanySettings();
  const address = customer
    ? [customer.addressLine, customer.district, customer.city].filter(Boolean).join(", ")
    : "";
  return {
    id: `ek1-${occurrence.id}`,
    periyotOccurrenceId: occurrence.id,
    uygulayanFirmaAdi: company.companyName || "",
    acikAdresi: company.address || "",
    mesulMudur: "",
    uygulayicilar: occurrence.personnelName || "",
    telefon: company.phone || "",
    izinTarihSayisi: [company.permitDate, company.permitNumber].filter(Boolean).join(" / "),
    ekipSorumlusu: occurrence.personnelName || "",
    urunTicariAdi: summarizeBiocidalUsages(occurrence),
    urunUygulamaSekli: "",
    urunAktifMaddesi: "",
    urunAntidotu: "",
    urunAmbalajMiktari: "",
    uygulamaYeriAdresi: address,
    hedefZararliTuru: "",
    meskenIsyeriVb: "İşyeri",
    meskenDaireSayisi: "",
    uygulamaAlani: "",
    uygulamaAlaniBirimi: "m2",
    kullanilanMalzemeler: "",
    malzemeKullanimlari: [],
    malzemelerEtkin: true,
    guvenlikOnlemleri: "",
    ekipSorumlusuImza: occurrence.personnelName || "",
    ekipSorumlusuImzaData: null,
    yeriSorumlusuImza: customer?.contactName ?? "",
    yeriSorumlusuImzaData: null,
    updatedAt: new Date().toISOString(),
  };
}

export function Ek1Dialog({ open, onOpenChange, occurrence, customerId, batchName, onSaved }: Ek1DialogProps) {
  const [form, setForm] = useState<Ek1Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [customer, setCustomer] = useState<Ek1CustomerInfo | null>(null);
  const [technicianOptions, setTechnicianOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/operations/technicians")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { technicians?: { name: string; status: string }[] } | null) => {
        setTechnicianOptions((data?.technicians ?? []).filter((t) => t.status === "active").map((t) => t.name));
      })
      .catch(() => setTechnicianOptions([]));
  }, [open]);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    fetch(`/api/crm/customers/${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer?: Ek1CustomerInfo } | null) => {
        if (!cancelled && data?.customer) setCustomer(data.customer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  useEffect(() => {
    if (!open || !occurrence) return;
    let cancelled = false;
    fetch(`/api/crm/periyot/occurrences/${occurrence.id}/ek1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ek1Form?: Ek1Form | null } | null) => {
        if (cancelled) return;
        const base = data?.ek1Form ?? buildDefaultEk1Form(occurrence, customer);
        setForm({
          ...base,
          ekipSorumlusuImzaData: base.ekipSorumlusuImzaData ?? null,
          yeriSorumlusuImzaData: base.yeriSorumlusuImzaData ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setForm(buildDefaultEk1Form(occurrence, customer));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, occurrence?.id, customer]);

  function update(patch: Partial<Ek1Form>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSave() {
    if (!form || !occurrence) return;
    setSaving(true);
    const res = await fetch(`/api/crm/periyot/occurrences/${occurrence.id}/ek1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("EK-1 formu kaydedilemedi");
      return;
    }
    const data = await res.json();
    setForm(data.ek1Form);
    toast.success("EK-1 formu kaydedildi");
    onSaved?.();
  }

  async function handlePrint() {
    if (!form || !occurrence) return;
    setPrinting(true);
    try {
      await printEk1Form(form, occurrence, customer?.companyName ?? "", batchName);
    } finally {
      setPrinting(false);
    }
  }

  const timeRangeText = occurrence
    ? `${formatDateLong(occurrence.periodDate)} ${occurrence.startTime} - ${occurrence.endTime}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            EK-1 Biyosidal Ürün Uygulama İşlem Formu
          </DialogTitle>
        </DialogHeader>

        {!form ? null : (
          <div className="max-h-[65vh] min-w-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                (Değişik: RG-19/4/2014-28977) — Alan başlıkları resmi form ile sabittir, sadece değerleri doldurun.
              </div>

              <Section title="Uygulamayı Yapana Ait Bilgiler">
                <Field label="Uygulamayı Yapan Firma Adı" value={form.uygulayanFirmaAdi} onChange={(v) => update({ uygulayanFirmaAdi: v })} />
                <Field label="Açık Adresi" value={form.acikAdresi} onChange={(v) => update({ acikAdresi: v })} />
                <div>
                  <Label className="mb-1.5">Mesul Müdür</Label>
                  <Select value={form.mesulMudur || undefined} onValueChange={(v) => update({ mesulMudur: String(v) })}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue placeholder="Seçiniz…">{() => form.mesulMudur || "Seçiniz…"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {technicianOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TechnicianMultiSelect label="Uygulayıcı(lar) Adı, Soyadı" value={form.uygulayicilar} onChange={(v) => update({ uygulayicilar: v })} options={technicianOptions} />
                <Field label="Telefon" value={form.telefon} onChange={(v) => update({ telefon: v })} />
                <Field label="Müdürlük İzin Tarih ve Sayısı" value={form.izinTarihSayisi} onChange={(v) => update({ izinTarihSayisi: v })} />
                <Field label="Ekip Sorumlusu" value={form.ekipSorumlusu} onChange={(v) => update({ ekipSorumlusu: v })} />
              </Section>

              <Section title="Kullanılan Biyosidal Ürüne Ait Bilgiler">
                <Field label="Ürünün Ticari Adı, Ruhsat Tarih ve Sayısı" value={form.urunTicariAdi} onChange={(v) => update({ urunTicariAdi: v })} />
                <Field label="Ürünün Uygulama Şekli" value={form.urunUygulamaSekli} onChange={(v) => update({ urunUygulamaSekli: v })} />
                <Field label="Ürünün Aktif Maddesi" value={form.urunAktifMaddesi} onChange={(v) => update({ urunAktifMaddesi: v })} />
                <Field label="Ürünün Antidotu" value={form.urunAntidotu} onChange={(v) => update({ urunAntidotu: v })} />
                <Field label="Ürünün Ambalajının Miktarı (kg/litre)" value={form.urunAmbalajMiktari} onChange={(v) => update({ urunAmbalajMiktari: v })} />
              </Section>

              <Section title="Uygulama Yapılan Yer Hakkında Bilgiler">
                <Field label="Uygulama Yapılan Yerin Açık Adresi" value={form.uygulamaYeriAdresi} onChange={(v) => update({ uygulamaYeriAdresi: v })} />
                <Field label="Uygulama Yapılan Hedef Zararlı Türü/Adı" value={form.hedefZararliTuru} onChange={(v) => update({ hedefZararliTuru: v })} />
                <div>
                  <Label className="mb-1.5">Uygulama Tarihi, Başlangıç ve Bitiş Saati</Label>
                  <div className="flex h-11 items-center rounded-xl border border-border/60 bg-muted/40 px-3.5 text-sm text-muted-foreground">
                    {timeRangeText}
                  </div>
                </div>
                <Field label="Mesken/İşyeri vb." value={form.meskenIsyeriVb} onChange={(v) => update({ meskenIsyeriVb: v })} />
                <Field label="Mesken İse Daire Sayısı" value={form.meskenDaireSayisi} onChange={(v) => update({ meskenDaireSayisi: v })} />
                <Field label="Uygulama Yapılan Yerin Alanı" value={form.uygulamaAlani} onChange={(v) => update({ uygulamaAlani: v })} placeholder="Örn. 200 m2" />
                <div>
                  <Label className="mb-1.5">Kullanılan Malzemeler</Label>
                  <div className="flex h-11 items-center rounded-xl border border-border/60 bg-muted/40 px-3.5 text-sm text-muted-foreground">
                    {form.kullanilanMalzemeler || "Periyodu Düzenle ekranından girilir"}
                  </div>
                </div>
                <FieldArea label="Alınan Güvenlik Önlemleri, Yapılan Öneri ve Uyarılar" value={form.guvenlikOnlemleri} onChange={(v) => update({ guvenlikOnlemleri: v })} />
              </Section>

              <Section title="İmza">
                <div className="flex flex-col gap-2.5">
                  <Field label="Ekip Sorumlusu İmza (Ad Soyad)" value={form.ekipSorumlusuImza} onChange={(v) => update({ ekipSorumlusuImza: v })} />
                  <SignaturePad
                    key={`ekip-${form.periyotOccurrenceId}`}
                    label="Online İmza"
                    value={form.ekipSorumlusuImzaData}
                    onChange={(dataUrl) => update({ ekipSorumlusuImzaData: dataUrl })}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Field label="Uygulama Yapılan Yerin Sorumlusu/Yetkilisi İmza (Ad Soyad)" value={form.yeriSorumlusuImza} onChange={(v) => update({ yeriSorumlusuImza: v })} />
                  <SignaturePad
                    key={`yeri-${form.periyotOccurrenceId}`}
                    label="Online İmza"
                    value={form.yeriSorumlusuImzaData}
                    onChange={(dataUrl) => update({ yeriSorumlusuImzaData: dataUrl })}
                  />
                </div>
              </Section>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" loading={printing} disabled={!form} onClick={handlePrint}>
            <Printer className="size-3.5" />
            Yazdır / PDF
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="button" loading={saving} disabled={!form} onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 rounded-xl px-3.5" />
    </div>
  );
}

export function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={cn("sm:col-span-2")}>
      <Label className="mb-1.5">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[72px] rounded-xl px-3.5 py-2.5" />
    </div>
  );
}
