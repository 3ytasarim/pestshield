"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/crm/form-fields";
import { quickCustomerSchema, type QuickCustomerValues } from "@/lib/validations/crm";

const EMPTY: QuickCustomerValues = { companyName: "", contactPhone: "", contactEmail: "" };

interface QuickCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: { id: string; companyName: string }) => void;
}

export function QuickCustomerDialog({ open, onOpenChange, onCreated }: QuickCustomerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickCustomerValues>({ resolver: zodResolver(quickCustomerSchema), defaultValues: EMPTY });

  async function submit(values: QuickCustomerValues) {
    try {
      const res = await fetch("/api/crm/customers/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Müşteri oluşturulamadı");
        return;
      }
      toast.success("Müşteri eklendi");
      onCreated(data.customer);
      reset(EMPTY);
      onOpenChange(false);
    } catch {
      toast.error("Müşteri oluşturulamadı — sunucuya ulaşılamadı");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(EMPTY);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4.5 text-primary" />
            Yeni Müşteri Ekle
          </DialogTitle>
          <DialogDescription>
            Tek seferlik veya günlük bir iş için hızlıca müşteri oluşturun — diğer bilgileri sonra müşteri detayından tamamlayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
          <TextField label="Firma / Müşteri Adı" required registration={register("companyName")} error={errors.companyName?.message} placeholder="Yakamoz Restaurant" />
          <TextField label="Telefon" registration={register("contactPhone")} error={errors.contactPhone?.message} />
          <TextField label="E-posta" registration={register("contactEmail")} error={errors.contactEmail?.message} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <UserPlus className="size-4" />
              Müşteriyi Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
