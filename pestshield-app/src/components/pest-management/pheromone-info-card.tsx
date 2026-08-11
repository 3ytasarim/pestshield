"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

interface TargetGroup {
  icon: string;
  title: string;
  note: string;
  species: string[];
}

const TARGET_GROUPS: TargetGroup[] = [
  {
    icon: "🪰",
    title: "Sinekler ve İki Kanatlılar (Diptera)",
    note: "Meyve yetiştiriciliğinde büyük ekonomik kayıplara yol açan sinek türlerinin hem popülasyon takibinde hem de kitlesel yakalanmasında eşeysel veya beslemsel feromonlar yoğun şekilde tercih edilir.",
    species: [
      "Akdeniz Meyve Sineği (Ceratitis capitata)",
      "Zeytin Sineği (Bactrocera oleae)",
      "Kiraz Sineği (Rhagoletis cerasi)",
    ],
  },
  {
    icon: "🪲",
    title: "Kınkanatlılar ve Coleoptera Takımı",
    note: "Orman alanlarına zarar veren kabuk böcekleri ile depolanmış tahıl zararlılarına karşı feromon kullanımı, orman ekosistemini korumada ve kimyasal ilaçlamayı azaltmada temel yöntemlerden biridir.",
    species: [
      "Orman Kabuk Böcekleri (Örn: Ips sexdentatus, Ips typographus)",
      "Kırmızı Palmiye Böceği (Rhynchophorus ferrugineus)",
      "Ekin Kambur Böceği (Zabrus spp.)",
      "Un Bitleri ve Tel Kurtları",
    ],
  },
  {
    icon: "🪵",
    title: "Yarım Kanatlılar ve Thripsler (Hemiptera & Thysanoptera)",
    note: "Bitki özsuyunu emerek beslenen ve virüs taşıyıcılığı yapan emici zararlıların kontrolünde feromon kombinasyonları etkilidir.",
    species: [
      "Thrips Türleri (Örn: Çiçek thripsi — Frankliniella occidentalis)",
      "Unlu Bitler ve Koşniller (Örn: Turunçgil unlu biti — Planococcus citri)",
      "Kahverengi Kokarca Böceği (Halyomorpha halys)",
    ],
  },
  {
    icon: "🐝",
    title: "Zarsı Kanatlılar (Hymenoptera)",
    note: "Testereli Arılar: Özellikle meyve ağaçlarının çiçek ve sürgün dönemlerine zarar veren arı türlerinin tuzaklanmasında kullanılır.",
    species: [],
  },
];

export function PheromoneInfoCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Info className="size-4 text-primary" />
            Feromon Kullanım Rehberi — Hedef Zararlı Türleri
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        <p className="text-sm text-foreground/80">
          Feromon tuzakları tarım, ormancılık ve depolama alanlarında güve haricindeki sinekler, kınkanatlı böcekler, thripsler ve
          kabuklu bitler gibi çok sayıda farklı zararlı türünün biyoteknik mücadelesinde aktif olarak kullanılmaktadır. Güve
          (Lepidoptera) takımı dışındaki en yaygın kullanım alanları ve hedef zararlı türleri şunlardır:
        </p>

        {open && (
          <div className="flex flex-col gap-4 border-t border-border/60 pt-3">
            {TARGET_GROUPS.map((group) => (
              <div key={group.title} className="rounded-xl bg-muted/30 p-3.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{group.icon}</span>
                  {group.title}
                </p>
                <p className="mt-1 text-xs text-foreground/80">{group.note}</p>
                {group.species.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {group.species.map((s) => (
                      <li key={s} className="text-xs text-muted-foreground">
                        • {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
