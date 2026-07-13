"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Star, Users } from "lucide-react";
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
import { ContactForm } from "@/components/crm/detail/contact-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { getContacts, type Contact } from "@/lib/mock/crm";
import type { ContactFormValues } from "@/lib/validations/crm";

export function ContactsTab({ customerId }: { customerId: string }) {
  const [contacts, setContacts] = useState<Contact[]>(() => getContacts(customerId));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  function handleSubmit(values: ContactFormValues) {
    if (editing) {
      setContacts((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...values } : c)));
      setEditing(null);
      return;
    }
    setContacts((prev) => [{ ...values, id: `${customerId}-contact-${Date.now()}`, customerId }, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">İletişim Kişileri</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Kişi Ekle
        </Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={Users} title="Henüz iletişim kişisi yok" description="Yeni bir kişi ekleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead className="hidden sm:table-cell">Ünvan</TableHead>
                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                <TableHead className="hidden lg:table-cell">E-posta</TableHead>
                <TableHead className="hidden lg:table-cell">Departman</TableHead>
                <TableHead>Birincil Kişi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{contact.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{contact.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{contact.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{contact.department}</TableCell>
                  <TableCell>
                    {contact.isPrimary && <Star className="size-4 fill-amber-400 text-amber-400" />}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(contact);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(contact)}>
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

      <ContactForm
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
            <AlertDialogTitle>Kişiyi sil</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleting?.name}&rdquo; kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setContacts((prev) => prev.filter((c) => c.id !== deleting?.id));
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
