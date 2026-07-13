"use client";

import { Switch } from "@/components/ui/switch";

interface HizmetOnaySwitchProps {
  approved: boolean;
  onToggle: () => void;
}

/** Hizmet kaydının onay durumunu gösteren/değiştiren yeşil-gri anahtar. */
export function HizmetOnaySwitch({ approved, onToggle }: HizmetOnaySwitchProps) {
  return (
    <Switch
      checked={approved}
      onCheckedChange={onToggle}
      aria-label={approved ? "Hizmeti onaydan kaldır" : "Hizmeti onayla"}
      className="data-checked:bg-success"
    />
  );
}
