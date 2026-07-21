"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileSignature } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContractStatusBadge } from "@/components/crm/crm-badges";
import { formatDate, formatCurrency } from "@/components/crm/crm-format";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Contract } from "@/lib/mock/crm";

export default function CustomerPortalContractsPage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);

  useEffect(() => {
    fetch("/api/portal/contracts")
      .then((res) => res.json())
      .then((data) => setContracts(data.contracts))
      .catch(() => toast.error("Sözleşmeler yüklenemedi"));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Sözleşmeler</h1>

      {contracts === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="Sözleşme bulunamadı" description="Hesabınıza ait bir sözleşme kaydı yok." />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sözleşme No</TableHead>
                <TableHead className="hidden sm:table-cell">Hizmet Türü</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead className="hidden md:table-cell">Aylık Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNo}</TableCell>
                  <TableCell className="hidden sm:table-cell">{contract.serviceType}</TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCurrency(contract.monthlyAmount, contract.currency)}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
