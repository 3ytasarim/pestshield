"use client";

import { ShieldCheck } from "lucide-react";

export function AiTypingIndicator() {
  return (
    <div className="flex gap-2" role="status" aria-label="PestShield AI yazıyor">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-muted/60 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
