"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bug } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, FieldWrapper } from "@/components/crm/form-fields";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { pestSpeciesFormSchema, type PestSpeciesFormValues } from "@/lib/validations/pest-management";
import { PEST_CATEGORY_LABELS, type PestCategory } from "@/lib/mock/pest-management";
import type { PestSpeciesEntryDTO } from "@/lib/pest-management/serialize";

const CATEGORY_OPTIONS = (Object.keys(PEST_CATEGORY_LABELS) as PestCategory[]).map((value) => ({
  value,
  label: PEST_CATEGORY_LABELS[value],
}));

const RISK_LEVEL_OPTIONS = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
  { value: "critical", label: "Kritik" },
];

const ICON_OPTIONS = [
  { value: "rodent", label: "Kemirgen" },
  { value: "roach", label: "Hamamböceği" },
  { value: "ant", label: "Karınca" },
  { value: "fly", label: "Sinek" },
  { value: "mosquito", label: "Sivrisinek" },
  { value: "spider", label: "Örümcek" },
  { value: "wasp", label: "Arı/Yaban Arısı" },
  { value: "beetle", label: "Kınkanatlı/Böcek" },
];

const EMPTY: PestSpeciesFormValues = {
  name: "",
  scientificName: "",
  category: "surunen_hasere",
  riskLevel: "medium",
  activeSeason: "",
  icon: "roach",
  contentHtml: "",
};

interface PestSpeciesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PestSpeciesFormValues) => void;
  editing?: PestSpeciesEntryDTO | null;
}

export function PestSpeciesForm({ open, onOpenChange, onSubmit, editing }: PestSpeciesFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PestSpeciesFormValues>({
    resolver: zodResolver(pestSpeciesFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            scientificName: editing.scientificName,
            category: editing.category as PestSpeciesFormValues["category"],
            riskLevel: editing.riskLevel as PestSpeciesFormValues["riskLevel"],
            activeSeason: editing.activeSeason,
            icon: editing.icon as PestSpeciesFormValues["icon"],
            contentHtml: editing.contentHtml,
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="size-5 text-primary" />
            {editing ? "Zararlı Türünü Düzenle" : "Yeni Zararlı Türü Ekle"}
          </DialogTitle>
          <DialogDescription>Tür bilgilerini ve kontrol yöntemini girin — bu içerik sizin firmanıza özeldir.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Tür Adı" registration={register("name")} error={errors.name?.message} required />
            <TextField label="Bilimsel Adı" registration={register("scientificName")} error={errors.scientificName?.message} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField label="Kategori" name="category" control={control} options={CATEGORY_OPTIONS} required />
            <SelectField label="Risk Seviyesi" name="riskLevel" control={control} options={RISK_LEVEL_OPTIONS} required />
            <SelectField label="İkon" name="icon" control={control} options={ICON_OPTIONS} required />
          </div>
          <TextField label="Aktif Mevsim" registration={register("activeSeason")} placeholder="Örn: Yıl Boyu, Yaz Ayları" error={errors.activeSeason?.message} />

          <FieldWrapper label="Açıklama ve Kontrol Yöntemi">
            <Controller
              control={control}
              name="contentHtml"
              render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Tür açıklaması, risk detayı, önerilen kontrol yöntemi..." />}
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
