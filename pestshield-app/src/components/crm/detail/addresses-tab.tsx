"use client";

import { useState } from "react";
import { MapPin, MoreHorizontal, Plus, Star } from "lucide-react";
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
import { AddressForm } from "@/components/crm/detail/address-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { ADDRESS_TYPE_LABELS } from "@/components/crm/crm-labels";
import { getAddresses, type Address } from "@/lib/mock/crm";
import type { AddressFormValues } from "@/lib/validations/crm";

export function AddressesTab({ customerId }: { customerId: string }) {
  const [addresses, setAddresses] = useState<Address[]>(() => getAddresses(customerId));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  function handleSubmit(values: AddressFormValues) {
    if (editing) {
      setAddresses((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...values } : a)));
      setEditing(null);
      return;
    }
    setAddresses((prev) => [{ ...values, id: `${customerId}-address-${Date.now()}`, customerId }, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Adresler</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Adres Ekle
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="Henüz adres eklenmemiş" description="Yeni bir adres ekleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adres Tipi</TableHead>
                <TableHead className="hidden sm:table-cell">Şehir</TableHead>
                <TableHead className="hidden md:table-cell">İlçe</TableHead>
                <TableHead className="hidden lg:table-cell">Açık Adres</TableHead>
                <TableHead>Varsayılan</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell className="font-medium">{ADDRESS_TYPE_LABELS[address.type]}</TableCell>
                  <TableCell className="hidden sm:table-cell">{address.city}</TableCell>
                  <TableCell className="hidden md:table-cell">{address.district}</TableCell>
                  <TableCell className="hidden max-w-xs truncate lg:table-cell">{address.addressLine}</TableCell>
                  <TableCell>
                    {address.isDefault && <Star className="size-4 fill-amber-400 text-amber-400" />}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(address);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(address)}>
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

      <AddressForm
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
            <AlertDialogTitle>Adresi sil</AlertDialogTitle>
            <AlertDialogDescription>Bu adres kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setAddresses((prev) => prev.filter((a) => a.id !== deleting?.id));
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
