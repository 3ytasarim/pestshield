"use client";

import { useState } from "react";
import { Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PestIconKey } from "@/lib/mock/pest-management";

/**
 * `public/pests/{key}.png` altına eklenecek gerçek tür görsellerine referans verir.
 * Dosya henüz eklenmediyse (404) sessizce lucide Bug ikonuna düşer — kırık görsel
 * göstermez. Beklenen dosyalar: rodent, roach, ant, fly, mosquito, spider, wasp, beetle.
 */
export function PestIcon({ icon, className }: { icon: PestIconKey; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Bug className="size-1/2 text-current" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/pests/${icon}.png`}
      alt=""
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
