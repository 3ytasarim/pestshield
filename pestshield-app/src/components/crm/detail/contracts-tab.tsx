"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, FileSignature, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";
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
import { ContractStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { ContractForm } from "@/components/crm/detail/contract-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { printContract } from "@/components/crm/detail/print-contract";
import type { Contract, Customer } from "@/lib/mock/crm";
import type { ContractFormValues } from "@/lib/validations/crm";

export function ContractsTab({ customerId, customer }: { customerId: string; customer: Customer }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/crm/contracts?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setContracts(data.contracts))
      .catch(() => toast.error("Sözleşmeler yüklenemedi"));
  }, [customerId]);

  async function handleSubmit(values: ContractFormValues) {
    const res = await fetch("/api/crm/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId }),
    });
    if (!res.ok) {
      toast.error("Sözleşme oluşturulamadı");
      return;
    }
    const data = await res.json();
    setContracts((prev) => [data.contract, ...prev]);
  }

  async function cancelContract(contract: Contract) {
    const res = await fetch(`/api/crm/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      toast.error("Sözleşme iptal edilemedi");
      return;
    }
    const data = await res.json();
    setContracts((prev) => prev.map((c) => (c.id === contract.id ? data.contract : c)));
    toast.success("Sözleşme iptal edildi");
  }

  async function handleUpdate(values: ContractFormValues) {
    if (!editingContract) return;
    const res = await fetch(`/api/crm/contracts/${editingContract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Sözleşme güncellenemedi");
      return;
    }
    setContracts((prev) => prev.map((c) => (c.id === editingContract.id ? data.contract : c)));
    toast.success("Sözleşme güncellendi");
    setEditingContract(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/contracts/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Sözleşme silinemedi");
        return;
      }
      setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Sözleşme silindi");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function renewContract(contract: Contract) {
    const res = await fetch(`/api/crm/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active", remainingDays: 365 }),
    });
    if (!res.ok) {
      toast.error("Sözleşme yenilenemedi");
      return;
    }
    const data = await res.json();
    setContracts((prev) => prev.map((c) => (c.id === contract.id ? data.contract : c)));
    toast.success("Sözleşme yenilendi");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sözleşmeler</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Sözleşme
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="Henüz sözleşme yok" description="Yeni bir sözleşme oluşturun." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sözleşme No</TableHead>
                <TableHead className="hidden lg:table-cell">Hizmet Türü</TableHead>
                <TableHead className="hidden xl:table-cell">Başlangıç</TableHead>
                <TableHead className="hidden md:table-cell">Bitiş</TableHead>
                <TableHead className="hidden sm:table-cell">Aylık Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Kalan Gün</TableHead>
                <TableHead className="hidden xl:table-cell">Dosya</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNo}</TableCell>
                  <TableCell className="hidden lg:table-cell">{contract.serviceType}</TableCell>
                  <TableCell className="hidden xl:table-cell">{formatDate(contract.startDate)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(contract.endDate)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatCurrency(contract.monthlyAmount, contract.currency)}</TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{contract.remainingDays >= 0 ? `${contract.remainingDays} gün` : "—"}</TableCell>
                  <TableCell className="hidden max-w-[140px] truncate text-xs text-muted-foreground xl:table-cell">
                    {contract.fileName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => customer && printContract(customer, contract)}>
                          <Eye className="size-3.5" />
                          Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => renewContract(contract)}>
                          <RefreshCw className="size-3.5" />
                          Yenile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingContract(contract)}>
                          <Pencil className="size-3.5" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => cancelContract(contract)}>
                          <XCircle className="size-3.5" />
                          İptal Et
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(contract)}>
                          <Trash2 className="size-3.5" />
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

      <ContractForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} />
      <ContractForm
        open={!!editingContract}
        onOpenChange={(open) => !open && setEditingContract(null)}
        onSubmit={handleUpdate}
        editing={editingContract}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sözleşmeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.contractNo}&quot; sözleşmesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={handleDelete}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
