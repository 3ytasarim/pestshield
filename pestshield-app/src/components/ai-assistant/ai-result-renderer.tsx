"use client";

import { AiKpiGrid } from "@/components/ai-assistant/ai-kpi-grid";
import { AiServiceList } from "@/components/ai-assistant/ai-service-list";
import { AiPeriodicServiceList } from "@/components/ai-assistant/ai-periodic-service-list";
import { AiPaymentTable } from "@/components/ai-assistant/ai-payment-table";
import { AiCustomerCard } from "@/components/ai-assistant/ai-customer-card";
import { AiCustomerList } from "@/components/ai-assistant/ai-customer-list";
import { AiContractList } from "@/components/ai-assistant/ai-contract-list";
import { AiTechnicianSchedule } from "@/components/ai-assistant/ai-technician-schedule";
import { AiTechnicianWorkload } from "@/components/ai-assistant/ai-technician-workload";
import { AiRiskList } from "@/components/ai-assistant/ai-risk-list";
import { AiCorrectiveActionList } from "@/components/ai-assistant/ai-corrective-action-list";
import { AiSourceSummary } from "@/components/ai-assistant/ai-source-summary";
import { AiOperationalIntelligence } from "@/components/ai-assistant/ai-operational-intelligence";
import { AiTrendAnalysis } from "@/components/ai-assistant/ai-trend-analysis";
import { AiPeriodComparison } from "@/components/ai-assistant/ai-period-comparison";
import { AiRiskIntelligence } from "@/components/ai-assistant/ai-risk-intelligence";
import { AiTechnicianIntelligence } from "@/components/ai-assistant/ai-technician-intelligence";
import { AiAuditIntelligence } from "@/components/ai-assistant/ai-audit-intelligence";
import { AiExecutiveSummary } from "@/components/ai-assistant/ai-executive-summary";
import { AiInsightFeed } from "@/components/ai-assistant/ai-insight-feed";
import { AiReportResult } from "@/components/ai-assistant/ai-report-result";
import { AiActionProposalCard } from "@/components/ai-assistant/actions/ai-action-proposal-card";
import type { AiToolResult } from "@/lib/ai/types";

export type AiProposalAction = "confirm" | "cancel" | "edit" | "retry";

/**
 * Tool sonucundaki `responseType`'a göre doğru yapılandırılmış bileşeni
 * seçen dispatcher. Model asla serbest metinle bir arayüz üretmez —
 * sadece bu sabit eşleme render edilir.
 */
export function AiResultRenderer({
  result,
  onPickCustomer,
  onProposalAction,
}: {
  result: AiToolResult;
  onPickCustomer: (companyName: string) => void;
  onProposalAction: (action: AiProposalAction, proposalId: string) => void;
}) {
  const showSource =
    result.source.recordCount > 0 &&
    result.responseType !== "clarification" &&
    result.responseType !== "error" &&
    result.responseType !== "empty_state" &&
    result.responseType !== "action_proposal";

  return (
    <div className="flex flex-col gap-1">
      {result.responseType === "clarification" && result.candidates && (
        <div className="flex flex-col gap-1.5">
          {result.candidates.map((c) => (
            <button
              key={c.customerId}
              type="button"
              onClick={() => onPickCustomer(c.companyName)}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              <span className="font-medium text-foreground">{c.companyName}</span>
              <span className="text-muted-foreground">{c.city}</span>
            </button>
          ))}
        </div>
      )}
      {(result.responseType === "summary" || result.responseType === "kpi_grid") && result.kpis && <AiKpiGrid kpis={result.kpis} />}
      {result.responseType === "service_list" && result.services && <AiServiceList services={result.services} />}
      {result.responseType === "periodic_service_list" && result.services && <AiPeriodicServiceList services={result.services} />}
      {result.responseType === "payment_table" && result.payments && <AiPaymentTable payments={result.payments} />}
      {result.responseType === "customer_card" && result.customer && <AiCustomerCard customer={result.customer} />}
      {result.responseType === "customer_list" && result.customers && <AiCustomerList customers={result.customers} />}
      {result.responseType === "contract_list" && result.contracts && <AiContractList contracts={result.contracts} />}
      {result.responseType === "technician_schedule" && result.schedule && <AiTechnicianSchedule schedule={result.schedule} />}
      {result.responseType === "technician_workload" && result.workload && <AiTechnicianWorkload workload={result.workload} />}
      {result.responseType === "risk_list" && result.risks && <AiRiskList risks={result.risks} />}
      {result.responseType === "corrective_action_list" && result.correctiveActions && <AiCorrectiveActionList correctiveActions={result.correctiveActions} />}
      {result.responseType === "operational_intelligence" && result.operationalIntelligence && <AiOperationalIntelligence data={result.operationalIntelligence} />}
      {result.responseType === "trend_analysis" && result.trendAnalysis && <AiTrendAnalysis data={result.trendAnalysis} />}
      {result.responseType === "period_comparison" && result.periodComparison && <AiPeriodComparison data={result.periodComparison} />}
      {result.responseType === "risk_intelligence" && result.riskIntelligence && <AiRiskIntelligence data={result.riskIntelligence} />}
      {result.responseType === "technician_intelligence" && result.technicianIntelligence && <AiTechnicianIntelligence data={result.technicianIntelligence} />}
      {result.responseType === "audit_intelligence" && result.auditIntelligence && <AiAuditIntelligence data={result.auditIntelligence} />}
      {result.responseType === "executive_summary" && result.executiveSummary && <AiExecutiveSummary data={result.executiveSummary} />}
      {result.responseType === "proactive_insights" && result.insights && <AiInsightFeed insights={result.insights} />}
      {result.responseType === "report_result" && result.report && <AiReportResult report={result.report} />}
      {result.responseType === "action_proposal" && result.proposal && (
        <AiActionProposalCard
          proposal={result.proposal}
          onConfirm={(id) => onProposalAction("confirm", id)}
          onCancel={(id) => onProposalAction("cancel", id)}
          onEdit={(id) => onProposalAction("edit", id)}
          onRetry={(id) => onProposalAction("retry", id)}
        />
      )}
      {showSource && <AiSourceSummary source={result.source} />}
    </div>
  );
}
