"use client";

// "AI Copilot" — yeni bir sohbet motoru İCAT ETMEZ; PestShield AI Asistan
// panelini (AiCommandCenter / AiCommandPanel) tek gerçek kaynak olarak
// kullanır. Bu sayfa sadece o panele giden, hazır öneri kartlarıyla
// zenginleştirilmiş bir giriş noktasıdır — konuşma geçmişi, araç çağırma
// döngüsü, ses, aksiyon onayı gibi hiçbir şey burada tekrar yazılmaz.

import { motion } from "framer-motion";
import { Bot, MessageSquarePlus, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { useAiPanel } from "@/components/ai-assistant/ai-panel-context";

const SUGGESTIONS = [
  "Bu ay gecikmiş servisleri göster",
  "Açık düzeltici faaliyetleri özetle",
  "Vadesi geçmiş tahsilatları listele",
  "Yükselen risk kayıtlarını göster",
  "Süresi yaklaşan sözleşmeleri göster",
  "Bugünkü iş emirlerinin durumunu özetle",
];

export function CopilotPage() {
  const { openAiPanel, openAiPanelWithPrompt } = useAiPanel();

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
          <Bot className="size-7 text-primary" />
          AI Copilot
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Verilerinize gerçek zamanlı erişimi olan PestShield AI Asistan&apos;ı buradan başlatın — müşteri, iş emri, tahsilat,
          risk ve denetim verilerinizi doğal dille sorgulayın, rapor oluşturun.
        </p>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-semibold text-foreground">Sohbete başlayın</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Sağ alttaki panel açılır; oradan sorularınızı yazabilir, rapor isteyebilir veya önerilen aksiyonları onaylayabilirsiniz.
            </p>
          </div>
          <Button onClick={openAiPanel} size="lg">
            <MessageSquarePlus className="size-4" />
            Sohbeti Aç
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">Hazır sorular</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => openAiPanelWithPrompt(suggestion)}
              className={cn(
                GLASS_CARD,
                "rounded-xl px-4 py-3.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
