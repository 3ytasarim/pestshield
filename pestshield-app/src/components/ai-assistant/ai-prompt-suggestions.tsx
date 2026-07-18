"use client";

const SUGGESTIONS = [
  "Bugünkü operasyon özeti",
  "Yarın hangi servisler var?",
  "Yarın hangi periyotlar var?",
  "Bugün kimlerden ödeme bekleniyor?",
  "Geciken tahsilatlar",
  "Kritik riskler",
  "Bu haftanın servis planı",
  "Müşteri ara",
];

export function AiPromptSuggestions({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Hızlı sorular">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
