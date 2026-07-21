"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";
import { setSupportLastSeen } from "@/lib/support/last-seen";
import type { SupportTicketDTO } from "@/lib/support/types";

const STATUS_STYLES: Record<SupportTicketDTO["status"], string> = {
  open: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  answered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<SupportTicketDTO["status"], string> = {
  open: "Yanıt Bekliyor",
  answered: "Yanıtlandı",
  closed: "Kapalı",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Superadmin",
  CLIENT: "Firma",
  CUSTOMER: "Müşteri",
  TECH: "Teknisyen",
};

interface SupportTicketsPanelProps {
  viewerUserId: string;
  /** API zaten role'e göre filtreliyor; CLIENT iki hiyerarşiyi de görüp burada ayırır. */
  openedByRoleFilter?: "CUSTOMER" | "CLIENT";
  canCreate: boolean;
  title: string;
  emptyDescription: string;
  /** ADMIN listede hangi firmadan geldiğini görsün. */
  showOwnerCompany?: boolean;
  /** CLIENT müşteri talepleri sekmesinde hangi müşteriden geldiğini görsün. */
  showCustomerName?: boolean;
}

export function SupportTicketsPanel({
  viewerUserId,
  openedByRoleFilter,
  canCreate,
  title,
  emptyDescription,
  showOwnerCompany,
  showCustomerName,
}: SupportTicketsPanelProps) {
  const [tickets, setTickets] = useState<SupportTicketDTO[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) return;
      const data = await res.json();
      const all: SupportTicketDTO[] = data.tickets;
      setTickets(openedByRoleFilter ? all.filter((t) => t.openedByRole === openedByRoleFilter) : all);
    } catch {
      // sessizce geç — periyodik yenileme, kullanıcıyı hata ile rahatsız etmeye gerek yok
    }
  }, [openedByRoleFilter]);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 20_000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const filteredTickets = tickets ?? [];
  const selected = filteredTickets.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [selected?.messages.length]);

  function openTicket(ticket: SupportTicketDTO) {
    setSelectedId(ticket.id);
    setSupportLastSeen();
  }

  async function handleCreate() {
    if (newSubject.trim().length < 3 || newBody.trim().length < 3) {
      toast.error("Konu ve mesaj en az 3 karakter olmalı");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, body: newBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Talep oluşturulamadı");
        return;
      }
      const data = await res.json();
      const ticket: SupportTicketDTO = data.ticket;
      setTickets((prev) => [ticket, ...(prev ?? [])]);
      setSelectedId(ticket.id);
      setNewDialogOpen(false);
      setNewSubject("");
      setNewBody("");
      toast.success("Destek talebi oluşturuldu");
    } finally {
      setCreating(false);
    }
  }

  async function handleReply() {
    if (!selected || replyBody.trim().length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Mesaj gönderilemedi");
        return;
      }
      setReplyBody("");
      setSupportLastSeen();
      await loadTickets();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {canCreate && (
          <Button size="sm" onClick={() => setNewDialogOpen(true)}>
            <Plus className="size-4" />
            Yeni Talep
          </Button>
        )}
      </div>

      {tickets === null ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : filteredTickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="Henüz destek talebi yok" description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-card md:grid-cols-[280px_1fr]">
          <div className="flex max-h-[560px] flex-col overflow-y-auto border-border/60 md:border-r">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket)}
                className={cn(
                  "flex flex-col gap-1 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selected?.id === ticket.id && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{ticket.subject}</p>
                </div>
                {(showOwnerCompany || showCustomerName) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {showOwnerCompany ? (ticket.owner?.companyName ?? "—") : (ticket.customer?.companyName ?? "—")}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDateTime(ticket.updatedAt)}</span>
                  <Badge variant="outline" className={cn("rounded-full text-[10px] font-medium", STATUS_STYLES[ticket.status])}>
                    {STATUS_LABELS[ticket.status]}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          <div className="flex min-h-[400px] flex-col">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Görüntülemek için soldan bir talep seçin
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selected.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {showOwnerCompany
                        ? (selected.owner?.companyName ?? "—")
                        : showCustomerName
                          ? (selected.customer?.companyName ?? "—")
                          : formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("rounded-full font-medium", STATUS_STYLES[selected.status])}>
                    {STATUS_LABELS[selected.status]}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {selected.messages.map((msg) => {
                    const mine = msg.authorUserId === viewerUserId;
                    return (
                      <div key={msg.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
                        <span className="text-[11px] text-muted-foreground">
                          {ROLE_LABELS[msg.authorRole] ?? msg.authorRole} · {formatDateTime(msg.createdAt)}
                        </span>
                        <div
                          className={cn(
                            "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                            mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                          )}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                {selected.status !== "closed" && (
                  <div className="flex items-end gap-2 border-t border-border/60 p-3">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="min-h-[44px] flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleReply} disabled={sending || replyBody.trim().length === 0}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Destek Talebi</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="support-subject">Konu</Label>
              <Input id="support-subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Kısaca konu başlığı" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="support-body">Mesajınız</Label>
              <Textarea id="support-body" value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Detayları yazın..." className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
