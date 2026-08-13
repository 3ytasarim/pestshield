"use client";

import { useMemo, useRef, useState } from "react";
import { Building2, Check, CircleCheck, Copy, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { LICENSE_PRESETS, computeDaysRemaining, computeLicenseStatus } from "@/lib/license";
import { readImageFile } from "@/lib/file-utils";
import type { LicenseType } from "@/generated/prisma";

interface CompanyRow {
  id: string;
  name: string | null;
  email: string | null;
  companyName: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  licenseType: LicenseType | null;
  licenseExpiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

interface CodeRow {
  id: string;
  code: string;
  type: LicenseType;
  durationDays: number;
  createdAt: string;
  redeemedAt: string | null;
  targetUser: { companyName: string | null; name: string | null; email: string | null } | null;
}

const STATUS_LABEL: Record<string, { label: string; variant: "outline" | "destructive" | "secondary" }> = {
  NONE: { label: "Lisans Yok", variant: "outline" },
  ACTIVE: { label: "Aktif", variant: "secondary" },
  EXPIRING_SOON: { label: "Yakında Doluyor", variant: "outline" },
  EXPIRED: { label: "Süresi Doldu", variant: "destructive" },
};

const TYPE_LABEL: Record<LicenseType, string> = {
  DEMO: "5 Günlük",
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
};

export function AdminCompaniesPage({
  companies: initialCompanies,
  codes: initialCodes,
}: {
  companies: CompanyRow[];
  codes: CodeRow[];
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [codes, setCodes] = useState(initialCodes);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [dialogTarget, setDialogTarget] = useState<CompanyRow | null>(null);
  const [selectedType, setSelectedType] = useState<LicenseType>("MONTHLY");
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [editTarget, setEditTarget] = useState<CompanyRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const rows = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        expiresAtDate: company.licenseExpiresAt ? new Date(company.licenseExpiresAt) : null,
      })),
    [companies],
  );

  function openDialog(company: CompanyRow) {
    setDialogTarget(company);
    setSelectedType("MONTHLY");
    setGeneratedCode(null);
    setCopied(false);
  }

  async function handleGenerate() {
    if (!dialogTarget) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/license-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: dialogTarget.id, type: selectedType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Lisans kodu oluşturulamadı");
        return;
      }
      setGeneratedCode(data.licenseCode.code);
      setCodes((prev) => [
        {
          id: data.licenseCode.id,
          code: data.licenseCode.code,
          type: data.licenseCode.type,
          durationDays: data.licenseCode.durationDays,
          createdAt: data.licenseCode.createdAt,
          redeemedAt: null,
          targetUser: {
            companyName: dialogTarget.companyName,
            name: dialogTarget.name,
            email: dialogTarget.email,
          },
        },
        ...prev,
      ]);
      toast.success("Lisans kodu oluşturuldu");
    } catch {
      toast.error("Lisans kodu oluşturulamadı");
    } finally {
      setGenerating(false);
    }
  }

  const pendingCount = useMemo(() => companies.filter((c) => !c.isActive).length, [companies]);

  async function handleActivate(id: string) {
    setActivatingId(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Firma aktive edilemedi");
        return;
      }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, isActive: data.company.isActive, licenseType: data.company.licenseType, licenseExpiresAt: data.company.licenseExpiresAt }
            : c,
        ),
      );
      toast.success("Firma aktive edildi — 5 günlük demo lisansı başladı");
    } catch {
      toast.error("Firma aktive edilemedi");
    } finally {
      setActivatingId(null);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Kod panoya kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetNewCompanyForm() {
    setNewCompanyName("");
    setNewCompanyEmail("");
    setNewCompanyPassword("");
    setNewCompanyAddress("");
    setNewCompanyPhone("");
    setNewCompanyLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleNewCompanyLogoSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setNewCompanyLogo(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo yüklenemedi");
    }
  }

  async function handleCreateCompany() {
    if (newCompanyName.trim().length < 2) {
      toast.error("Firma adını girin");
      return;
    }
    if (!newCompanyEmail.trim()) {
      toast.error("E-posta adresini girin");
      return;
    }
    if (newCompanyPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır");
      return;
    }
    setCreatingCompany(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newCompanyName.trim(),
          email: newCompanyEmail.trim(),
          password: newCompanyPassword,
          address: newCompanyAddress.trim() || undefined,
          phone: newCompanyPhone.trim() || undefined,
          logoUrl: newCompanyLogo ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Firma oluşturulamadı");
        return;
      }
      const newRow: CompanyRow = {
        id: data.company.id,
        name: null,
        email: data.company.email,
        companyName: data.company.companyName,
        address: data.company.address,
        phone: data.company.phone,
        logoUrl: data.company.logoUrl,
        licenseType: data.company.licenseType,
        licenseExpiresAt: data.company.licenseExpiresAt,
        createdAt: data.company.createdAt,
        isActive: data.company.isActive,
      };
      setCompanies((prev) => [newRow, ...prev]);
      toast.success("Firma oluşturuldu");
      setNewCompanyOpen(false);
      resetNewCompanyForm();
      openDialog(newRow);
    } catch {
      toast.error("Firma oluşturulamadı");
    } finally {
      setCreatingCompany(false);
    }
  }

  function openEditDialog(company: CompanyRow) {
    setEditTarget(company);
    setEditName(company.companyName ?? "");
    setEditEmail(company.email ?? "");
    setEditPassword("");
    setEditAddress(company.address ?? "");
    setEditPhone(company.phone ?? "");
    setEditLogo(company.logoUrl);
    if (editLogoInputRef.current) editLogoInputRef.current.value = "";
  }

  async function handleEditLogoSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setEditLogo(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo yüklenemedi");
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    if (editName.trim().length < 2) {
      toast.error("Firma adını girin");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("E-posta adresini girin");
      return;
    }
    if (editPassword && editPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/companies/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: editName.trim(),
          email: editEmail.trim(),
          password: editPassword || undefined,
          address: editAddress.trim() || undefined,
          phone: editPhone.trim() || undefined,
          logoUrl: editLogo ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Firma güncellenemedi");
        return;
      }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                companyName: data.company.companyName,
                email: data.company.email,
                address: data.company.address,
                phone: data.company.phone,
                logoUrl: data.company.logoUrl,
              }
            : c,
        ),
      );
      toast.success("Firma güncellendi");
      setEditTarget(null);
    } catch {
      toast.error("Firma güncellenemedi");
    } finally {
      setSavingEdit(false);
    }
  }

  function openDeleteDialog(company: CompanyRow) {
    setDeleteTarget(company);
    setDeleteConfirmText("");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/companies/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Firma silinemedi");
        return;
      }
      setCompanies((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Firma ve tüm verileri silindi");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Firmalar</h1>
          <p className="text-sm text-muted-foreground">
            PestShield&apos;e kayıtlı tüm zararlı kontrol firmaları ve lisans durumları.
            {pendingCount > 0 && (
              <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                {pendingCount} firma onay bekliyor
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setNewCompanyOpen(true)}>
          <Plus className="size-4" />
          Yeni Firma Oluştur
        </Button>
      </div>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Kayıtlı Firmalar ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Yetkili</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Lisans</TableHead>
                <TableHead>Kalan Gün</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const days = computeDaysRemaining(row.expiresAtDate);
                const status = computeLicenseStatus(row.expiresAtDate);
                const statusMeta = STATUS_LABEL[status];
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      {row.companyName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.licenseType ? TYPE_LABEL[row.licenseType] : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {days === null ? "—" : `${days} gün`}
                    </TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                          Onay Bekliyor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!row.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleActivate(row.id)}
                            loading={activatingId === row.id}
                          >
                            <CircleCheck className="size-3.5" />
                            Aktif Et
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openDialog(row)}>
                          <KeyRound className="size-3.5" />
                          Lisans Oluştur
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8" title="Düzenle" onClick={() => openEditDialog(row)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Sil"
                          onClick={() => openDeleteDialog(row)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Henüz kayıtlı firma yok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <CardTitle className="text-base">Son Oluşturulan Lisans Kodları</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.targetUser?.companyName || c.targetUser?.email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{TYPE_LABEL[c.type]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(c.createdAt),
                    )}
                  </TableCell>
                  <TableCell>
                    {c.redeemedAt ? (
                      <Badge variant="secondary">Kullanıldı</Badge>
                    ) : (
                      <Badge variant="outline">Bekliyor</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Henüz lisans kodu oluşturulmadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!dialogTarget} onOpenChange={(open) => !open && setDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lisans Oluştur</DialogTitle>
            <DialogDescription>
              {dialogTarget?.companyName || dialogTarget?.email} için yeni bir lisans kodu üret.
            </DialogDescription>
          </DialogHeader>

          {!generatedCode ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">Lisans Türü</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as LicenseType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_PRESETS.map((preset) => (
                    <SelectItem key={preset.type} value={preset.type}>
                      {preset.label} ({preset.durationDays} gün)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Bu kodu firmayla paylaşın — kendi panellerindeki &quot;Lisans&quot; sayfasına
                yapıştırıp uygulayacaklar.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <span className="flex-1 font-mono text-sm font-semibold tracking-wide text-foreground">
                  {generatedCode}
                </span>
                <Button size="icon-sm" variant="ghost" onClick={() => handleCopy(generatedCode)}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {!generatedCode ? (
              <Button onClick={handleGenerate} loading={generating}>
                Kod Oluştur
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setDialogTarget(null)}>
                Kapat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={newCompanyOpen}
        onOpenChange={(open) => {
          setNewCompanyOpen(open);
          if (!open) resetNewCompanyForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Firma Oluştur</DialogTitle>
            <DialogDescription>
              Firma kaydını ve giriş bilgilerini oluşturun. Ardından hemen lisans atayabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
                {newCompanyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newCompanyLogo} alt="Firma logosu" className="size-full object-contain p-1" />
                ) : (
                  <Building2 className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Logo Yükle
                </Button>
                <span className="text-[11px] text-muted-foreground">PNG, JPG veya SVG · maks. 5MB</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleNewCompanyLogoSelect(e.target.files?.[0])}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-company-name">Firma Adı</Label>
              <Input
                id="new-company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Örn. Pakiş Temizlik İlaçlama"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-company-email">E-posta (giriş kullanıcı adı)</Label>
              <Input
                id="new-company-email"
                type="email"
                value={newCompanyEmail}
                onChange={(e) => setNewCompanyEmail(e.target.value)}
                placeholder="firma@ornek.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-company-password">Şifre</Label>
              <Input
                id="new-company-password"
                type="password"
                value={newCompanyPassword}
                onChange={(e) => setNewCompanyPassword(e.target.value)}
                placeholder="En az 8 karakter"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-company-phone">Telefon</Label>
              <Input
                id="new-company-phone"
                value={newCompanyPhone}
                onChange={(e) => setNewCompanyPhone(e.target.value)}
                placeholder="(5xx) xxx xx xx"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-company-address">Adres</Label>
              <Input
                id="new-company-address"
                value={newCompanyAddress}
                onChange={(e) => setNewCompanyAddress(e.target.value)}
                placeholder="Açık adres"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateCompany} loading={creatingCompany}>
              Firma Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Firmayı Düzenle</DialogTitle>
            <DialogDescription>Firma kaydını ve giriş bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
                {editLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editLogo} alt="Firma logosu" className="size-full object-contain p-1" />
                ) : (
                  <Building2 className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => editLogoInputRef.current?.click()}>
                  Logo Yükle
                </Button>
                <span className="text-[11px] text-muted-foreground">PNG, JPG veya SVG · maks. 5MB</span>
                <input
                  ref={editLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleEditLogoSelect(e.target.files?.[0])}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company-name">Firma Adı</Label>
              <Input id="edit-company-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company-email">E-posta (giriş kullanıcı adı)</Label>
              <Input id="edit-company-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company-password">Yeni Şifre (opsiyonel)</Label>
              <Input
                id="edit-company-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company-phone">Telefon</Label>
              <Input id="edit-company-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-company-address">Adres</Label>
              <Input id="edit-company-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Vazgeç
            </Button>
            <Button onClick={handleSaveEdit} loading={savingEdit}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmayı sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.companyName}&quot; firmasını ve buna bağlı TÜM verileri (müşteriler, iş emirleri,
              faturalar, denetimler — her şey) kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Onaylamak için
              firma adını aşağıya yazın: <span className="font-semibold text-foreground">{deleteTarget?.companyName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Firma adını yazın"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting || deleteConfirmText !== (deleteTarget?.companyName ?? "")}
              onClick={handleDelete}
            >
              Kalıcı Olarak Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
