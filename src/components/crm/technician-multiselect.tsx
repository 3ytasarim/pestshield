"use client";

import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TechnicianMultiSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

/** Virgülle ayrılmış personel adları metnini (ör. "Ahmet Yılmaz, Gürkan Gürsoy")
 * çıkarılabilir etiketler + eklemek için bir seçim kutusu olarak düzenler. */
export function TechnicianMultiSelect({ label, value, onChange, options }: TechnicianMultiSelectProps) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const remaining = options.filter((o) => !selected.includes(o));

  function addTechnician(name: string) {
    onChange([...selected, name].join(", "));
  }

  function removeTechnician(name: string) {
    onChange(selected.filter((s) => s !== name).join(", "));
  }

  return (
    <div className="sm:col-span-2">
      <Label className="mb-1.5">{label}</Label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border/60 px-2.5 py-2">
        {selected.map((name) => (
          <span key={name} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1.5 pl-2.5 text-xs font-medium text-primary">
            {name}
            <button type="button" onClick={() => removeTechnician(name)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`${name} kaldır`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {remaining.length > 0 && (
          <Select value={undefined} onValueChange={(v) => v && addTechnician(String(v))}>
            <SelectTrigger className="h-7 min-w-[110px] rounded-full border-dashed px-2.5 text-xs">
              <SelectValue placeholder="+ Ekle" />
            </SelectTrigger>
            <SelectContent>
              {remaining.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
