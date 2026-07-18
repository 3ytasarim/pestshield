"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiActionType } from "@/lib/ai/actions/types";

const CONFIRM_LABEL: Record<AiActionType, string> = {
  create_service: "Onayla ve Oluştur",
  reschedule_service: "Onayla ve Güncelle",
  assign_technician: "Onayla ve Ata",
  create_followup_task: "Onayla ve Oluştur",
  prepare_email: "Onayla ve Gönder",
  send_email: "Onayla ve Gönder",
  send_whatsapp_message: "Onayla ve Gönder",
};

export function AiActionConfirmButtons({
  actionType,
  disabled,
  loading,
  onConfirm,
  onCancel,
}: {
  actionType: AiActionType;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="default" onClick={onConfirm} disabled={disabled} loading={loading} startContent={<Check className="size-3.5" aria-hidden="true" />}>
        {CONFIRM_LABEL[actionType]}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={loading} startContent={<X className="size-3.5" aria-hidden="true" />}>
        Vazgeç
      </Button>
    </div>
  );
}
