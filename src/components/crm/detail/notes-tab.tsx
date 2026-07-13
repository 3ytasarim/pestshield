"use client";

import { useState } from "react";
import { Bell, MoreHorizontal, Plus, StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { GLASS_CARD } from "@/components/dashboard/shared";
import { NotePriorityBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { NoteForm } from "@/components/crm/detail/note-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { getNotes, type Note } from "@/lib/mock/crm";
import type { NoteFormValues } from "@/lib/validations/crm";

function toFormValues(note: Note): NoteFormValues {
  return {
    title: note.title,
    content: note.content,
    priority: note.priority,
    tags: note.tags.join(", "),
    reminderDate: note.reminderDate ?? "",
  };
}

export function NotesTab({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<Note[]>(() => getNotes(customerId));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  function handleSubmit(values: NoteFormValues) {
    const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (editing) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? { ...n, ...values, tags, reminderDate: values.reminderDate || null }
            : n,
        ),
      );
      setEditing(null);
      return;
    }
    setNotes((prev) => [
      {
        id: `${customerId}-note-${Date.now()}`,
        customerId,
        title: values.title,
        content: values.content,
        author: "Siz",
        date: new Date().toISOString().slice(0, 10),
        priority: values.priority,
        tags,
        reminderDate: values.reminderDate || null,
      },
      ...prev,
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notlar</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Not Ekle
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Henüz not eklenmemiş" description="Müşteriyle ilgili notlarınızı ekleyin." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{note.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(note);
                          setFormOpen(true);
                        }}
                      >
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(note)}>
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground">{note.content}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <NotePriorityBadge priority={note.priority} />
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {note.author} · {formatDate(note.date)}
                  </span>
                  {note.reminderDate && (
                    <span className="flex items-center gap-1 text-primary">
                      <Bell className="size-3" />
                      {formatDate(note.reminderDate)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoteForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={editing ? toFormValues(editing) : undefined}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu sil</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleting?.title}&rdquo; kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setNotes((prev) => prev.filter((n) => n.id !== deleting?.id));
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
