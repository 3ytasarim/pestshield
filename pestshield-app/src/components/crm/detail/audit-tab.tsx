import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/crm/detail/empty-state";

export function AuditTab() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Audit</h2>
      <EmptyState
        icon={ShieldCheck}
        title="Denetim kayıtları yakında"
        description="HACCP, BRCGS, ISO 22000 ve FSSC denetim geçmişi ile düzeltici faaliyetler Denetim modülü bağlandığında bu sekmede görüntülenecek."
      />
    </div>
  );
}
