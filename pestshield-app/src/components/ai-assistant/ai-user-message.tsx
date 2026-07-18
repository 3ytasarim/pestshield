"use client";

import { User } from "lucide-react";

export function AiUserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-row-reverse gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <User className="size-3.5" aria-hidden="true" />
      </div>
      <div className="max-w-[85%] rounded-2xl bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">{content}</div>
    </div>
  );
}
