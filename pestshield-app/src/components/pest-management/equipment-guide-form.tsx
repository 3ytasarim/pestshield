"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Package2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextField, FieldWrapper } from "@/components/crm/form-fields";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { equipmentGuideFormSchema, type EquipmentGuideFormValues } from "@/lib/validations/pest-management";
import type { EquipmentCategory } from "@/lib/mock/pest-management";
import type { EquipmentGuideEntryDTO, PestSpeciesEntryDTO } from "@/lib/pest-management/serialize";
import { cn } from "@/lib/utils";

function emptyValues(category: EquipmentCategory): EquipmentGuideFormValues {
  return { category, title: "", contentHtml: "", targetSpeciesIds: [], relatedProductKeywords: [] };
}

interface EquipmentGuideFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EquipmentGuideFormValues) => void;
  category: EquipmentCategory;
  species: PestSpeciesEntryDTO[];
  editing?: EquipmentGuideEntryDTO | null;
}

export function EquipmentGuideForm({ open, onOpenChange, onSubmit, category, species, editing }: EquipmentGuideFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentGuideFormValues>({
    resolver: zodResolver(equipmentGuideFormSchema),
    defaultValues: emptyValues(category),
  });

  const [keywordDraft, setKeywordDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setKeywordDraft("");
    reset(
      editing
        ? {
            category,
            title: editing.title,
            contentHtml: editing.contentHtml,
            targetSpeciesIds: editing.targetSpeciesIds,
            relatedProductKeywords: editing.relatedProductKeywords,
          }
        : emptyValues(category),
    );
  }, [open, editing, category, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="size-5 text-primary" />
            {editing ? "Rehberi Düzenle" : "Yeni Rehber Ekle"}
          </DialogTitle>
          <DialogDescription>Uygulama rehberi içeriği — bu kayıt sizin firmanıza özeldir.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField label="Başlık" registration={register("title")} error={errors.title?.message} required />

          <FieldWrapper label="Açıklama ve Kullanım Notu">
            <Controller
              control={control}
              name="contentHtml"
              render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Rehber açıklaması, kullanım notu, yerleşim aralığı..." />}
            />
          </FieldWrapper>

          <FieldWrapper label="Hedef Türler">
            <Controller
              control={control}
              name="targetSpeciesIds"
              render={({ field }) => (
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
                  {species.length === 0 ? (
                    <p className="px-1.5 py-2 text-xs text-muted-foreground">Önce Zararlı Türleri sayfasından tür ekleyin.</p>
                  ) : (
                    species.map((s) => {
                      const checked = field.value.includes(s.id);
                      return (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => field.onChange(checked ? field.value.filter((id) => id !== s.id) : [...field.value, s.id])}
                            className="size-4 rounded border-border accent-primary"
                          />
                          <span className="text-foreground/90">{s.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            />
          </FieldWrapper>

          <FieldWrapper label="Envanter Eşleştirme Anahtar Kelimeleri" error={errors.relatedProductKeywords?.message}>
            <Controller
              control={control}
              name="relatedProductKeywords"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={keywordDraft}
                      onChange={(e) => setKeywordDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const value = keywordDraft.trim();
                        if (value && !field.value.includes(value)) field.onChange([...field.value, value]);
                        setKeywordDraft("");
                      }}
                      placeholder="Ürün adında geçen kelime, Enter'a basın"
                      className="h-11 rounded-xl px-3.5"
                    />
                  </div>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((kw) => (
                        <span key={kw} className={cn("flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80")}>
                          {kw}
                          <button type="button" onClick={() => field.onChange(field.value.filter((v) => v !== kw))} aria-label={`${kw} kaldır`}>
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </FieldWrapper>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Kaydet" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
