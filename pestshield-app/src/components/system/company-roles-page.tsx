"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { CompanyRoleForm, type CompanyRoleFormValues } from "@/components/system/company-role-form";
import type { CompanyRole } from "@/lib/system/serialize";
import { cn } from "@/lib/utils";

export function CompanyRolesPage({ viewerCompanyRoleId }: { viewerCompanyRoleId: string | null }) {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRole | null>(null);

  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/system/company-roles");
      const data = await res.json();
      setRoles(res.ok ? (data.roles ?? []) : []);
    } catch {
      toast.error("Roller alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(role: CompanyRole) {
    setEditing(role);
    setFormOpen(true);
  }

  async function handleSubmit(values: CompanyRoleFormValues) {
    const isEditing = !!editing;
    const url = isEditing ? `/api/system/company-roles/${editing!.id}` : "/api/system/company-roles";
    const res = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, visibleNavHrefs: values.visibleNavHrefs }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "İşlem başarısız oldu");
      return;
    }
    toast.success(isEditing ? "Rol güncellendi" : "Rol eklendi");
    await loadRoles();
  }

  async function handleDelete(role: CompanyRole) {
    if (!window.confirm(`"${role.name}" rolü silinsin mi?`)) return;
    const res = await fetch(`/api/system/company-roles/${role.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message ?? "Rol silinemedi");
      return;
    }
    toast.success("Rol silindi");
    await loadRoles();
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Roller</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Her rolün sidebar&apos;da hangi bölümleri göreceğini belirleyin. Detaylı eylem izinleri için Yetkiler sayfasını kullanın.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Yeni Rol Ekle
        </Button>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          {loading ? null : roles.length === 0 ? (
            <EmptyState icon={Shield} title="Henüz rol yok" description="“Yeni Rol Ekle” ile ilk özel rolünüzü oluşturun." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol Adı</TableHead>
                  <TableHead>Görünür Bölüm</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => {
                  const isOwnRole = role.id === viewerCompanyRoleId;
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium text-foreground">
                        {role.name}
                        {isOwnRole && (
                          <Badge variant="outline" className="ml-2">
                            Sizin rolünüz
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{role.visibleNavHrefs.length} bölüm</TableCell>
                      <TableCell className="text-muted-foreground">{role.userCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon-sm" variant="outline" disabled={isOwnRole} onClick={() => openEdit(role)} aria-label="Rolü düzenle">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            disabled={isOwnRole}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(role)}
                            aria-label="Rolü sil"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CompanyRoleForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} editing={editing} />
    </div>
  );
}
