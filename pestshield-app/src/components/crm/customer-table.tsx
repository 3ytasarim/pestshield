"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RiskBadge, CustomerStatusBadge, ContractStatusBadge, CustomerTypeBadge, PotentialBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import type { Customer, ContractStatus } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

interface CustomerTableProps {
  customers: Customer[];
  contractStatusByCustomer: Record<string, ContractStatus>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCreateOffer: (customer: Customer) => void;
  onCreateContract: (customer: Customer) => void;
  onCreateWorkOrder: (customer: Customer) => void;
  onCreateService: (customer: Customer) => void;
  onViewAccount: (customer: Customer) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ROW_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(index, 12) * 0.03, duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const COLUMN_LABELS: Record<string, string> = {
  contactName: "Yetkili Kişi",
  contactPhone: "Telefon",
  contactEmail: "E-posta",
  city: "Şehir",
  sector: "Sektör",
  customerType: "Müşteri Tipi",
  status: "Müşteri Durumu",
  contractStatus: "Sözleşme Durumu",
  riskLevel: "Risk Skoru",
  lastServiceDate: "Son Servis Tarihi",
};

export function CustomerTable({
  customers,
  contractStatusByCustomer,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onCreateOffer,
  onCreateContract,
  onCreateWorkOrder,
  onCreateService,
  onViewAccount,
  canEdit = true,
  canDelete = true,
}: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "companyName",
        enableHiding: false,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-auto p-0 font-medium hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Firma Adı
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="block max-w-[120px] truncate font-medium sm:max-w-[220px]">
            {row.original.companyName}
          </span>
        ),
      },
      {
        accessorKey: "contactName",
        header: "Yetkili Kişi",
        meta: { className: "hidden sm:table-cell" },
      },
      {
        accessorKey: "contactPhone",
        header: "Telefon",
        meta: { className: "hidden lg:table-cell" },
      },
      {
        accessorKey: "contactEmail",
        header: "E-posta",
        meta: { className: "hidden xl:table-cell" },
      },
      {
        accessorKey: "city",
        header: "Şehir",
        meta: { className: "hidden md:table-cell" },
      },
      {
        accessorKey: "sector",
        header: "Sektör",
        meta: { className: "hidden xl:table-cell" },
      },
      {
        accessorKey: "customerType",
        header: "Müşteri Tipi",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <CustomerTypeBadge type={row.original.customerType} />
            {row.original.isPotential && <PotentialBadge />}
          </div>
        ),
        meta: { className: "hidden md:table-cell" },
      },
      {
        accessorKey: "status",
        header: "Müşteri Durumu",
        cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
      },
      {
        id: "contractStatus",
        header: "Sözleşme Durumu",
        cell: ({ row }) => <ContractStatusBadge status={contractStatusByCustomer[row.original.id] ?? "active"} />,
        meta: { className: "hidden lg:table-cell" },
      },
      {
        accessorKey: "riskLevel",
        header: "Risk Skoru",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <RiskBadge level={row.original.riskLevel} />
            <span className="hidden text-xs text-muted-foreground sm:inline">{row.original.riskScore}</span>
          </div>
        ),
      },
      {
        accessorKey: "lastServiceDate",
        header: "Son Servis Tarihi",
        cell: ({ row }) => formatDate(row.original.lastServiceDate),
        meta: { className: "hidden md:table-cell" },
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelect(customer.id)}>Detay</DropdownMenuItem>
                {canEdit && <DropdownMenuItem onClick={() => onEdit(customer)}>Düzenle</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCreateOffer(customer)}>Teklif Oluştur</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateContract(customer)}>Sözleşme Ekle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateWorkOrder(customer)}>İş Emri Oluştur</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateService(customer)}>Hizmet Ekle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAccount(customer)}>Cari Hesap Görüntüle</DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(customer)}>
                      Sil
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onSelect, onEdit, onDelete, onCreateOffer, onCreateContract, onCreateWorkOrder, onCreateService, onViewAccount, contractStatusByCustomer, canEdit, canDelete],
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
        <span className="text-sm font-semibold text-foreground">Müşteri Listesi</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{customers.length} kayıt</span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <SlidersHorizontal className="size-3.5" />
              Sütunlar
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Görünür Sütunlar</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {COLUMN_LABELS[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={ROW_VARIANTS}
                  onClick={() => onSelect(row.original.id)}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer border-l-2 border-l-transparent",
                    selectedId === row.original.id &&
                      "border-l-primary bg-primary/[0.06] hover:bg-primary/[0.08] data-[state=selected]:bg-primary/[0.06]",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  Kriterlere uyan müşteri bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
