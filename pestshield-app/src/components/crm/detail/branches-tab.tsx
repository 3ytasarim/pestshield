"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, MoreHorizontal, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RiskBadge, CustomerStatusBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { BranchForm } from "@/components/crm/detail/branch-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import type { Branch } from "@/lib/mock/crm";
import type { BranchFormValues } from "@/lib/validations/crm";

export function BranchesTab({ customerId }: { customerId: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  useEffect(() => {
    fetch(`/api/crm/branches?customerId=${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { branches: Branch[] } | null) => setBranches(data?.branches ?? []))
      .catch(() => setBranches([]));
  }, [customerId]);

  async function handleSubmit(values: BranchFormValues) {
    if (editing) {
      const res = await fetch(`/api/crm/branches/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Şube güncellenemedi");
        return;
      }
      setBranches((prev) => prev.map((b) => (b.id === editing.id ? data.branch : b)));
      setEditing(null);
      return;
    }

    const res = await fetch("/api/crm/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Şube oluşturulamadı");
      return;
    }
    setBranches((prev) => [data.branch, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Şubeler</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Şube Ekle
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Henüz şube eklenmemiş"
          description="Bu müşteriye ait şubeleri buradan ekleyebilirsiniz."
        />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şube Adı</TableHead>
                <TableHead className="hidden md:table-cell">Şehir</TableHead>
                <TableHead className="hidden lg:table-cell">İlçe</TableHead>
                <TableHead className="hidden sm:table-cell">Yetkili Kişi</TableHead>
                <TableHead className="hidden lg:table-cell">Telefon</TableHead>
                <TableHead className="hidden sm:table-cell">Hizmet Durumu</TableHead>
                <TableHead>Risk Seviyesi</TableHead>
                <TableHead className="hidden md:table-cell">Son Servis Tarihi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{branch.city}</TableCell>
                  <TableCell className="hidden lg:table-cell">{branch.district}</TableCell>
                  <TableCell className="hidden sm:table-cell">{branch.contactName}</TableCell>
                  <TableCell className="hidden lg:table-cell">{branch.phone}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <CustomerStatusBadge status={branch.serviceStatus} />
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={branch.riskLevel} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(branch.lastServiceDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(branch);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(branch)}>
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BranchForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={editing ?? undefined}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şubeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                const res = await fetch(`/api/crm/branches/${deleting.id}`, { method: "DELETE" });
                if (!res.ok) {
                  toast.error("Şube silinemedi");
                  return;
                }
                setBranches((prev) => prev.filter((b) => b.id !== deleting.id));
                setDeleting(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
