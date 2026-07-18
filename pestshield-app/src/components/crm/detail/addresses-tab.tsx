"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import type { Address } from "@/lib/mock/crm";
import type { AddressFormValues } from "@/lib/validations/crm";

export function AddressesTab({ customerId }: { customerId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  useEffect(() => {
    fetch(`/api/crm/addresses?customerId=${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { addresses: Address[] } | null) => setAddresses(data?.addresses ?? []))
      .catch(() => setAddresses([]));
  }, [customerId]);

  async function handleSubmit(values: AddressFormValues) {
    if (editing) {
      const res = await fetch(`/api/crm/addresses/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Adres güncellenemedi");
        return;
      }
      setAddresses((prev) => prev.map((a) => (a.id === editing.id ? data.address : a)));
      setEditing(null);
      return;
    }

    const res = await fetch("/api/crm/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Adres oluşturulamadı");
      return;
    }
    setAddresses((prev) => [data.address, ...prev]);
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
              onClick={async () => {
                if (!deleting) return;
                const res = await fetch(`/api/crm/addresses/${deleting.id}`, { method: "DELETE" });
                if (!res.ok) {
                  toast.error("Adres silinemedi");
                  return;
                }
                setAddresses((prev) => prev.filter((a) => a.id !== deleting.id));
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
