"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Key, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { getClientNavHrefs } from "@/components/layout/nav-config";
import type { CompanyPermissionAction } from "@/lib/api-auth";
import type { CompanyRole, CompanyRolePermissions } from "@/lib/system/serialize";
import { cn } from "@/lib/utils";

const NAV_HREFS = getClientNavHrefs();
const ACTIONS: { key: CompanyPermissionAction; label: string }[] = [
  { key: "view", label: "Görüntüle" },
  { key: "create", label: "Ekle" },
  { key: "edit", label: "Düzenle" },
  { key: "delete", label: "Sil" },
];

export function CompanyPermissionsPage({ viewerCompanyRoleId }: { viewerCompanyRoleId: string | null }) {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<CompanyRolePermissions>({});
  const [saving, setSaving] = useState(false);

  async function loadRoles(preserveSelection = false) {
    setLoading(true);
    try {
      const res = await fetch("/api/system/company-roles");
      const data = await res.json();
      const list: CompanyRole[] = res.ok ? (data.roles ?? []) : [];
      setRoles(list);
      if (!preserveSelection || !list.some((r) => r.id === selectedRoleId)) {
        setSelectedRoleId(list[0]?.id ?? "");
      }
    } catch {
      toast.error("Roller alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);
  const isOwnRole = selectedRoleId === viewerCompanyRoleId;

  useEffect(() => {
    setPermissions(selectedRole?.permissions ?? {});
  }, [selectedRole]);

  function toggle(href: string, action: CompanyPermissionAction, checked: boolean) {
    setPermissions((prev) => ({
      ...prev,
      [href]: { ...prev[href], [action]: checked },
    }));
  }

  async function handleSave() {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/system/company-roles/${selectedRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Yetkiler kaydedilemedi");
        return;
      }
      toast.success("Yetkiler güncellendi");
      await loadRoles(true);
    } finally {
      setSaving(false);
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
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Yetkiler</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Seçtiğiniz rolün her modülde hangi eylemleri yapabileceğini belirleyin.</p>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          {loading ? null : roles.length === 0 ? (
            <EmptyState icon={Key} title="Henüz rol yok" description="Yetki tanımlayabilmek için önce Roller sayfasından bir rol oluşturun." />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="w-full max-w-xs">
                  <Select value={selectedRoleId} onValueChange={(value) => setSelectedRoleId(value ?? "")}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue>{() => roles.find((r) => r.id === selectedRoleId)?.name ?? "Rol seçiniz"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} loading={saving} disabled={!selectedRoleId || isOwnRole}>
                  <Save className="size-4" />
                  Kaydet
                </Button>
              </div>

              {isOwnRole && (
                <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Kendi rolünüzün yetkilerini değiştiremezsiniz — bu, kazara kendi erişiminizi kilitlemenizi önler.
                </p>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modül</TableHead>
                      {ACTIONS.map((action) => (
                        <TableHead key={action.key} className="text-center">
                          {action.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NAV_HREFS.map((item) => (
                      <TableRow key={item.href}>
                        <TableCell className="text-sm text-foreground">
                          <span className="text-xs text-muted-foreground">{item.group} · </span>
                          {item.label}
                        </TableCell>
                        {ACTIONS.map((action) => (
                          <TableCell key={action.key} className="text-center">
                            <Checkbox
                              disabled={isOwnRole}
                              checked={permissions[item.href]?.[action.key] ?? false}
                              onCheckedChange={(checked) => toggle(item.href, action.key, !!checked)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
