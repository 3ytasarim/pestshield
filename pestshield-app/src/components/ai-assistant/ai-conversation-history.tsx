"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiConversation } from "@/lib/ai/conversation-store";

export function AiConversationHistory({
  conversations,
  activeId,
  onPick,
  onDelete,
}: {
  conversations: AiConversation[];
  activeId: string | undefined;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return <p className="p-4 text-center text-xs text-muted-foreground">Henüz kayıtlı sohbet yok.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {conversations.map((c) => (
        <div
          key={c.id}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
            activeId === c.id ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/40",
          )}
        >
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onPick(c.id)}>
            <p className="truncate font-medium text-foreground">{c.title}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(c.updatedAt).toLocaleString("tr-TR")}</p>
          </button>
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none"
            aria-label={`"${c.title}" sohbetini sil`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
