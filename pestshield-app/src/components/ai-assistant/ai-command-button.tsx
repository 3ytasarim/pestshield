"use client";

import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AiCommandButton({
  open,
  hasUnread,
  onClick,
}: {
  open: boolean;
  hasUnread: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label="PestShield AI Asistan"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-6 sm:bottom-6",
              open && "pointer-events-none scale-95 opacity-0",
            )}
          />
        }
      >
        <ShieldCheck className="size-6" aria-hidden="true" />
        {hasUnread && !open && (
          <span className="absolute top-1 right-1 flex size-3" aria-label="Okunmamış cevap var" role="status">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-3 rounded-full bg-success ring-2 ring-background" />
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="left">PestShield AI Asistan</TooltipContent>
    </Tooltip>
  );
}
