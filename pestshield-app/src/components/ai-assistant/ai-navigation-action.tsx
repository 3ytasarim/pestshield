"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiNavigationAction as AiNavigationActionType } from "@/lib/ai/types";

/** Model asla URL üretmez — burada sadece tool sonuçlarında hazır gelen, uygulama kodu tarafından üretilmiş güvenilir route'lar render edilir. */
export function AiNavigationAction({ action }: { action: AiNavigationActionType }) {
  return (
    <Button variant="outline" size="sm" className="self-start" nativeButton={false} render={<Link href={action.href} />}>
      {action.label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Button>
  );
}
