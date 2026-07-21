"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { CompanyUserForm, type CompanyUserFormDialogValues } from "@/components/system/company-user-form";
import type { CompanyRole, CompanyUser } from "@/lib/system/serialize";
import { cn } from "@/lib/utils";

export function CompanyUsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyUser | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([fetch("/api/system/company-users"), fetch("/api/system/company-roles")]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersRes.ok ? (usersData.companyUsers ?? []) : []);
      setRoles(rolesRes.ok ? (rolesData.roles ?? []) : []);
    } catch {
      toast.error("Kullanıcılar alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: CompanyUser) {
    setEditing(user);
    setFormOpen(true);
  }

  async function handleSubmit(values: CompanyUserFormDialogValues) {
    const isEditing = !!editing;
    const url = isEditing ? `/api/system/company-users/${editing!.id}` : "/api/system/company-users";
    const body = isEditing
      ? { name: values.name, email: values.email, roleId: values.roleId, isActive: values.isActive, ...(values.password ? { password: values.password } : {}) }
      : { name: values.name, email: values.email, roleId: values.roleId, password: values.password };

    const res = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "İşlem başarısız oldu");
      return;
    }
    toast.success(isEditing ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
    await loadData();
  }

  async function handleDelete(user: CompanyUser) {
    if (!window.confirm(`${user.name} kalıcı olarak silinsin mi?`)) return;
    const res = await fetch(`/api/system/company-users/${user.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message ?? "Kullanıcı silinemedi");
      return;
    }
    toast.success("Kullanıcı silindi");
    await loadData();
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Kullanıcılar</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Firmanız içinde giriş yapabilecek ek kullanıcı hesapları ve rolleri.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Yeni Kullanıcı Ekle
        </Button>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          {loading ? null : users.length === 0 ? (
            <EmptyState icon={Users} title="Henüz kullanıcı yok" description="“Yeni Kullanıcı Ekle” ile firmanıza ek bir giriş hesabı ekleyin." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.roleName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={user.isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : undefined}
                      >
                        {user.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="icon-sm" variant="outline" onClick={() => openEdit(user)} aria-label="Kullanıcıyı düzenle">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user)}
                          aria-label="Kullanıcıyı sil"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CompanyUserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        roles={roles}
        editing={editing ? { name: editing.name, email: editing.email, roleId: editing.roleId, isActive: editing.isActive } : null}
      />
    </div>
  );
}
