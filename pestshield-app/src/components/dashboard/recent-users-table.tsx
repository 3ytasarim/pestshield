"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserRow {
  name: string;
  email: string;
  role: "ADMIN" | "TECH" | "CLIENT";
}

// Sprint 0 - Design System örneği: gerçek veri sonraki sprintte bağlanacak.
const PLACEHOLDER_ROWS: UserRow[] = [
  { name: "Ayşe Yılmaz", email: "ayse@pakis.com", role: "ADMIN" },
  { name: "Mehmet Demir", email: "mehmet@pakis.com", role: "TECH" },
  { name: "ABC Liman A.Ş.", email: "info@abcliman.com", role: "CLIENT" },
];

const columnHelper = createColumnHelper<UserRow>();

export function RecentUsersTable() {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Ad" }),
      columnHelper.accessor("email", { header: "E-posta" }),
      columnHelper.accessor("role", {
        header: "Rol",
        cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: PLACEHOLDER_ROWS,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Kullanıcılar</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
