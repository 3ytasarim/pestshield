"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import type { AiRecommendation } from "@/lib/mock/dashboard";

interface AiRecommendationCardProps {
  recommendations: AiRecommendation[];
  delay?: number;
}

export function AiRecommendationCard({ recommendations, delay = 0 }: AiRecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card
        className={cn(
          GLASS_CARD,
          "h-full border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card",
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="size-4.5" />
            </div>
            <CardTitle>AI Tavsiyeleri</CardTitle>
          </div>
          <CardDescription>Verilerinize göre oluşturulan öneriler</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {recommendations.map((rec, index) => (
              <motion.li
                key={rec.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.05 }}
                className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-3 text-sm"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground/90">{rec.message}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
