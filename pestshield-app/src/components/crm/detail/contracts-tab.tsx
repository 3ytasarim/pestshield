"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, FileSignature, MoreHorizontal, Plus, RefreshCw, XCircle } from "lucide-react";
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
import { ContractStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { ContractForm } from "@/components/crm/detail/contract-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { getContracts, type Contract } from "@/lib/mock/crm";
import type { ContractFormValues } from "@/lib/validations/crm";

export function ContractsTab({ customerId }: { customerId: string }) {
  const [contracts, setContracts] = useState<Contract[]>(() => getContracts(customerId));
  const [formOpen, setFormOpen] = useState(false);

  function handleSubmit(values: ContractFormValues) {
    const remainingDays = Math.round((new Date(values.endDate).getTime() - Date.now()) / 86_400_000);
    const newContract: Contract = {
      id: `${customerId}-contract-${Date.now()}`,
      customerId,
      contractNo: values.contractNo,
      serviceType: values.serviceType,
      startDate: values.startDate,
      endDate: values.endDate,
      monthlyAmount: values.monthlyAmount,
      currency: values.currency,
      status: remainingDays < 0 ? "expired" : remainingDays <= 30 ? "expiring" : "active",
      remainingDays,
      fileName: "Yeni Sözleşme.pdf",
    };
    setContracts((prev) => [newContract, ...prev]);
  }

  function cancelContract(contract: Contract) {
    setContracts((prev) => prev.map((c) => (c.id === contract.id ? { ...c, status: "cancelled" } : c)));
    toast.success("Sözleşme iptal edildi");
  }

  function renewContract(contract: Contract) {
    setContracts((prev) => prev.map((c) => (c.id === contract.id ? { ...c, status: "active", remainingDays: 365 } : c)));
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
                        <DropdownMenuItem onClick={() => toast.info("Görüntüleme yakında eklenecek")}>
                          <Eye className="size-3.5" />
                          Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => renewContract(contract)}>
                          <RefreshCw className="size-3.5" />
                          Yenile
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => cancelContract(contract)}>
                          <XCircle className="size-3.5" />
                          İptal Et
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
    </div>
  );
}
