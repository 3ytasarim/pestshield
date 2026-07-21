"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getClientNavHrefs } from "@/components/layout/nav-config";
import type { CompanyRole } from "@/lib/system/serialize";

export interface CompanyRoleFormValues {
  name: string;
  visibleNavHrefs: string[];
}

const NAV_HREFS = getClientNavHrefs();
const GROUPED = NAV_HREFS.reduce<Record<string, typeof NAV_HREFS>>((acc, item) => {
  (acc[item.group] ??= []).push(item);
  return acc;
}, {});

interface CompanyRoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyRoleFormValues) => Promise<void> | void;
  editing?: CompanyRole | null;
}

export function CompanyRoleForm({ open, onOpenChange, onSubmit, editing }: CompanyRoleFormProps) {
  const isEditing = !!editing;
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setSelected(new Set(editing?.visibleNavHrefs ?? []));
    }
  }, [open, editing]);

  function toggle(href: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  function toggleGroup(hrefs: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      hrefs.forEach((href) => (checked ? next.add(href) : next.delete(href)));
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), visibleNavHrefs: Array.from(selected) });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-4.5 text-primary" />
            {isEditing ? "Rolü Düzenle" : "Yeni Rol Ekle"}
          </DialogTitle>
          <DialogDescription>Bu role sahip kullanıcıların sidebar&apos;da göreceği bölümleri seçin.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-1.5">Rol Adı</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Operasyon Yöneticisi" className="h-11 rounded-xl px-3.5" />
          </div>

          <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
            {Object.entries(GROUPED).map(([group, items]) => {
              const allChecked = items.every((item) => selected.has(item.href));
              return (
                <div key={group} className="rounded-xl border border-border/60 p-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Checkbox checked={allChecked} onCheckedChange={(checked) => toggleGroup(items.map((i) => i.href), !!checked)} />
                    {group}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 pl-6 sm:grid-cols-2">
                    {items.map((item) => (
                      <label key={item.href} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox checked={selected.has(item.href)} onCheckedChange={() => toggle(item.href)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            <Shield className="size-4" />
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
