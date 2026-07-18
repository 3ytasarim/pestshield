"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import type { Contact } from "@/lib/mock/crm";
import type { ContactFormValues } from "@/lib/validations/crm";

export function ContactsTab({ customerId }: { customerId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  useEffect(() => {
    fetch(`/api/crm/contacts?customerId=${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { contacts: Contact[] } | null) => setContacts(data?.contacts ?? []))
      .catch(() => setContacts([]));
  }, [customerId]);

  async function handleSubmit(values: ContactFormValues) {
    if (editing) {
      const res = await fetch(`/api/crm/contacts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Kişi güncellenemedi");
        return;
      }
      setContacts((prev) => prev.map((c) => (c.id === editing.id ? data.contact : c)));
      setEditing(null);
      return;
    }

    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Kişi oluşturulamadı");
      return;
    }
    setContacts((prev) => [data.contact, ...prev]);
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
              onClick={async () => {
                if (!deleting) return;
                const res = await fetch(`/api/crm/contacts/${deleting.id}`, { method: "DELETE" });
                if (!res.ok) {
                  toast.error("Kişi silinemedi");
                  return;
                }
                setContacts((prev) => prev.filter((c) => c.id !== deleting.id));
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
