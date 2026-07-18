import "server-only";

// PestShield AI Command Center — gerçek, per-tenant Postgres implementasyonu.
// Her sorgu `ownerId` ile kiracıya göre filtrelenir. `getServiceOccurrences()`
// yalnızca Periyot'un zamanlama çekirdeğini (PeriyotBatch/PeriyotOccurrence)
// okur — Ek-1/Kroki/istasyon kontrolü/CAPA notları henüz Postgres'e
// taşınmadı, bu yüzden `isCompleted` o occurrence için biyosidal ürün
// kullanımı girilmiş mi (bir sonraki en iyi vekil gösterge) baz alınarak
// hesaplanır; kesin gösterge Ek-1 formu Postgres'e taşındığında eklenecek.

import { prisma } from "@/lib/db";
import { isCapaOverdue, riskLevel, riskScore } from "@/lib/mock/audit";
import { debtorStatus } from "@/lib/finance/serialize";
import { todayStr } from "@/lib/date-utils";
import type {
  AiChecklistRecord,
  AiCorrectiveActionHistoryRecord,
  AiCorrectiveActionRecord,
  AiCustomerRecord,
  AiDataProvider,
  AiInvoiceRecord,
  AiRiskHistoryRecord,
  AiRiskRecord,
  AiServiceOccurrence,
  AiTechnicianRecord,
} from "@/lib/ai/providers/data-provider";

export class PrismaAiDataProvider implements AiDataProvider {
  readonly name = "Postgres (per-tenant)";

  constructor(private readonly ownerId: string) {}

  async getServiceOccurrences(): Promise<AiServiceOccurrence[]> {
    const occurrences = await prisma.periyotOccurrence.findMany({
      where: { ownerId: this.ownerId },
      include: {
        customer: { select: { companyName: true } },
        serviceOrder: { select: { description: true } },
        _count: { select: { biocidalProductUsages: true } },
      },
      orderBy: { periodDate: "asc" },
    });
    return occurrences.map((o) => ({
      occurrenceId: o.id,
      customerId: o.customerId,
      customerName: o.customer.companyName,
      serviceOrderId: o.serviceOrderId,
      serviceName: o.serviceOrder.description || "Hizmet",
      personnelName: o.personnelName,
      periodDate: o.periodDate,
      startTime: o.startTime,
      endTime: o.endTime,
      isCompleted: o._count.biocidalProductUsages > 0,
    }));
  }

  async getInvoices(): Promise<AiInvoiceRecord[]> {
    const invoices = await prisma.invoice.findMany({
      where: { ownerId: this.ownerId },
      include: { customer: { select: { companyName: true } } },
      orderBy: { dueDate: "asc" },
    });
    return invoices.map((i) => ({
      invoiceNo: i.invoiceNo,
      customerId: i.customerId,
      customerName: i.customer.companyName,
      amount: Number(i.amount),
      dueDate: i.dueDate,
      status: i.status,
    }));
  }

  async getCustomers(): Promise<AiCustomerRecord[]> {
    const customers = await prisma.customer.findMany({
      where: { ownerId: this.ownerId },
      include: { _count: { select: { branches: true } } },
    });
    return customers.map((c) => ({
      customerId: c.id,
      companyName: c.companyName,
      sector: c.sector,
      city: c.city,
      status: c.status,
      riskLevel: c.riskLevel,
      pendingCollection: Number(c.pendingCollection),
      contractEndDate: c.contractEndDate,
      branchCount: c._count.branches,
    }));
  }

  async getCustomerBalance(customerId: string): Promise<{ balance: number; isOverdue: boolean; overdueDays: number }> {
    const [customer, invoices] = await Promise.all([
      prisma.customer.findFirst({ where: { id: customerId, ownerId: this.ownerId }, select: { pendingCollection: true } }),
      prisma.invoice.findMany({ where: { customerId, ownerId: this.ownerId }, select: { dueDate: true, status: true } }),
    ]);
    const status = debtorStatus(invoices, todayStr());
    return { balance: Number(customer?.pendingCollection ?? 0), isOverdue: status.overdue, overdueDays: status.days };
  }

  async getOpenRisks(): Promise<AiRiskRecord[]> {
    const risks = await prisma.risk.findMany({
      where: { ownerId: this.ownerId, status: { not: "closed" } },
      include: { customer: { select: { companyName: true } } },
    });
    return risks.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      likelihood: r.likelihood,
      impact: r.impact,
      status: riskLevel(riskScore(r)),
      customerId: r.customerId,
      customerName: r.customer?.companyName ?? null,
      owner: r.ownerName,
    }));
  }

  async getOpenCorrectiveActions(): Promise<AiCorrectiveActionRecord[]> {
    const capas = await prisma.correctiveAction.findMany({
      where: { ownerId: this.ownerId, status: { in: ["open", "in_progress"] } },
      include: { customer: { select: { companyName: true } } },
    });
    return capas.map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      status: c.status,
      dueDate: c.dueDate,
      customerId: c.customerId,
      customerName: c.customer?.companyName ?? null,
      responsible: c.responsible,
      overdue: isCapaOverdue(c),
    }));
  }

  async getTechnicians(): Promise<AiTechnicianRecord[]> {
    const technicians = await prisma.technician.findMany({ where: { ownerId: this.ownerId } });
    return technicians.map((t) => ({ id: t.id, name: t.name, status: t.status }));
  }

  async getAllRisks(): Promise<AiRiskHistoryRecord[]> {
    const risks = await prisma.risk.findMany({
      where: { ownerId: this.ownerId },
      include: { customer: { select: { companyName: true } } },
    });
    return risks.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      likelihood: r.likelihood,
      impact: r.impact,
      status: r.status,
      reviewDate: r.reviewDate,
      customerId: r.customerId,
      customerName: r.customer?.companyName ?? null,
      owner: r.ownerName,
    }));
  }

  async getAllCorrectiveActions(): Promise<AiCorrectiveActionHistoryRecord[]> {
    const capas = await prisma.correctiveAction.findMany({
      where: { ownerId: this.ownerId },
      include: { customer: { select: { companyName: true } } },
    });
    return capas.map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      status: c.status,
      dueDate: c.dueDate,
      customerId: c.customerId,
      customerName: c.customer?.companyName ?? null,
      responsible: c.responsible,
      overdue: isCapaOverdue(c),
      createdDate: c.createdDate,
      resolvedDate: c.resolvedDate,
    }));
  }

  async getChecklistItems(): Promise<AiChecklistRecord[]> {
    const items = await prisma.complianceChecklistItem.findMany({ where: { ownerId: this.ownerId } });
    return items.map((i) => ({ id: i.id, standard: i.standard, status: i.status, reviewDate: i.reviewDate }));
  }
}
