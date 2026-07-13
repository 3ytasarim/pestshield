"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { getAiInsights } from "@/lib/mock/crm";

export function AiCustomerInsights({ customerId }: { customerId: string }) {
  const insights = getAiInsights(customerId);

  return (
    <Card className={cn(GLASS_CARD, "border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card")}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="size-4.5" />
          </div>
          <CardTitle>AI Müşteri İçgörüleri</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {insights.map((insight, index) => (
            <motion.li
              key={insight}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-3 text-sm"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-foreground/90">{insight}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
