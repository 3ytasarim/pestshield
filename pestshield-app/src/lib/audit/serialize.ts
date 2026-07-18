import type {
  ComplianceChecklistItem as PrismaChecklistItem,
  AuditRecord as PrismaAuditRecord,
  CorrectiveAction as PrismaCorrectiveAction,
  Risk as PrismaRisk,
  PrismaClient,
} from "@/generated/prisma/client";
import { todayStr } from "@/lib/date-utils";
import {
  STANDARD_SECTIONS,
  type ChecklistItem,
  type ChecklistStatus,
  type ComplianceStandard,
  type AuditRecord,
  type AuditType,
  type AuditResult,
  type CorrectiveAction,
  type CapaSeverity,
  type CapaStatus,
  type CapaSource,
  type Risk,
  type RiskCategory,
  type RiskStatus,
} from "@/lib/mock/audit";

export function serializeChecklistItem(row: PrismaChecklistItem): ChecklistItem {
  const { ownerId: _ownerId, ...rest } = row;
  void _ownerId;
  return { ...rest, standard: row.standard as ComplianceStandard, status: row.status as ChecklistStatus };
}

export function serializeAuditRecord(row: PrismaAuditRecord): AuditRecord {
  const { ownerId: _ownerId, ...rest } = row;
  void _ownerId;
  return { ...rest, standard: row.standard as ComplianceStandard, type: row.type as AuditType, result: row.result as AuditResult };
}

export function serializeCorrectiveAction(row: PrismaCorrectiveAction): CorrectiveAction {
  const { ownerId: _ownerId, ...rest } = row;
  void _ownerId;
  return {
    ...rest,
    standard: row.standard as ComplianceStandard | null,
    source: row.source as CapaSource,
    severity: row.severity as CapaSeverity,
    status: row.status as CapaStatus,
  };
}

export function serializeRisk(row: PrismaRisk): Risk {
  const { ownerId: _ownerId, ownerName, ...rest } = row;
  void _ownerId;
  return { ...rest, owner: ownerName, category: row.category as RiskCategory, status: row.status as RiskStatus };
}

const STANDARDS: ComplianceStandard[] = ["haccp", "brcgs", "iso22000", "fssc"];

/** Yeni bir kiracı için uyumluluk checklist'i henüz oluşturulmadıysa, standart bölüm/madde kataloğundan nötr (status: pending) satırlar üretir. */
export async function ensureChecklistSeeded(prisma: PrismaClient, ownerId: string): Promise<void> {
  const count = await prisma.complianceChecklistItem.count({ where: { ownerId } });
  if (count > 0) return;

  const today = todayStr();
  const rows: {
    ownerId: string;
    standard: ComplianceStandard;
    sectionCode: string;
    sectionTitle: string;
    itemCode: string;
    title: string;
    description: string;
    reviewDate: string;
  }[] = [];

  STANDARDS.forEach((standard) => {
    STANDARD_SECTIONS[standard].forEach((section) => {
      section.items.forEach((item) => {
        rows.push({
          ownerId,
          standard,
          sectionCode: section.code,
          sectionTitle: section.title,
          itemCode: item.code,
          title: item.title,
          description: item.description,
          reviewDate: today,
        });
      });
    });
  });

  await prisma.complianceChecklistItem.createMany({ data: rows });
}
