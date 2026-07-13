import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IconInputProps extends React.ComponentProps<"input"> {
  icon: LucideIcon;
}

/** auth-switch tasarımındaki "pill" (yuvarlak, ikonlu) input alanı. */
export function IconInput({ icon: Icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("h-12 rounded-full pl-11", className)} {...props} />
    </div>
  );
}
