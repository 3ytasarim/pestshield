// Audit Raporları (Uygunluk Durumu + CAPA) için veri katmanı — mevcut
// denetim mock modülünün üzerine ince bir sorgu katmanı.

import {
  checklistItems,
  correctiveActions,
  isCapaOverdue,
  STANDARD_LABELS,
  type CapaSeverity,
  type CapaStatus,
  type ChecklistItem,
  type ChecklistStatus,
  type ComplianceStandard,
  type CorrectiveAction,
} from "@/lib/mock/audit";
import { getCustomerById } from "@/lib/mock/crm";

export { STANDARD_LABELS };

export function getUygunlukRows(options: { standard?: ComplianceStandard } = {}): ChecklistItem[] {
  return checklistItems
    .filter((i) => !options.standard || i.standard === options.standard)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function uygunlukOrani(rows: ChecklistItem[]): number {
  const relevant = rows.filter((i) => i.status !== "not_applicable");
  if (relevant.length === 0) return 100;
  const compliant = relevant.filter((i) => i.status === "compliant").length;
  return Math.round((compliant / relevant.length) * 100);
}

export function countByStatus(rows: ChecklistItem[], status: ChecklistStatus): number {
  return rows.filter((i) => i.status === status).length;
}

export interface CapaRow extends CorrectiveAction {
  customerName: string;
  overdue: boolean;
}

export function getCapaRows(options: { status?: CapaStatus; severity?: CapaSeverity } = {}): CapaRow[] {
  return correctiveActions
    .filter((c) => !options.status || c.status === options.status)
    .filter((c) => !options.severity || c.severity === options.severity)
    .map((c) => ({
      ...c,
      customerName: c.customerId ? (getCustomerById(c.customerId)?.companyName ?? "—") : "Genel",
      overdue: isCapaOverdue(c),
    }))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}
