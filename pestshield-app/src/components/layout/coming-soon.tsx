import { Construction } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/12 to-primary/[0.03] ring-1 ring-primary/10">
        <Construction className="size-6 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bu ekran sonraki bir sprintte geliştirilecektir.
        </p>
      </div>
    </div>
  );
}
