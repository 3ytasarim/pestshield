// Audit Raporları (Uygunluk Durumu + CAPA) için veri katmanı — gerçek
// checklist/CAPA kayıtları üzerinde filtreleme/sıralama yapan ince sorgu katmanı.

import {
  isCapaOverdue,
  STANDARD_LABELS,
  type CapaSeverity,
  type CapaStatus,
  type ChecklistItem,
  type ChecklistStatus,
  type ComplianceStandard,
  type CorrectiveAction,
} from "@/lib/mock/audit";

export { STANDARD_LABELS };

export function getUygunlukRows(items: ChecklistItem[], options: { standard?: ComplianceStandard } = {}): ChecklistItem[] {
  return items
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

export function getCapaRows(
  capas: CorrectiveAction[],
  customers: { id: string; companyName: string }[],
  options: { status?: CapaStatus; severity?: CapaSeverity } = {},
): CapaRow[] {
  return capas
    .filter((c) => !options.status || c.status === options.status)
    .filter((c) => !options.severity || c.severity === options.severity)
    .map((c) => ({
      ...c,
      customerName: c.customerId ? (customers.find((cu) => cu.id === c.customerId)?.companyName ?? "—") : "Genel",
      overdue: isCapaOverdue(c),
    }))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}
