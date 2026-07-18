"use client";

import { ShieldAlert } from "lucide-react";
import { AiActionFieldChange } from "@/components/ai-assistant/actions/ai-action-field-change";
import { AiActionWarnings } from "@/components/ai-assistant/actions/ai-action-warnings";
import { AiActionValidationErrors } from "@/components/ai-assistant/actions/ai-action-validation-errors";
import { AiActionConfirmButtons } from "@/components/ai-assistant/actions/ai-action-confirm-buttons";
import { AiActionExecutionProgress } from "@/components/ai-assistant/actions/ai-action-execution-progress";
import { AiActionResult } from "@/components/ai-assistant/actions/ai-action-result";
import { AiActionFailure } from "@/components/ai-assistant/actions/ai-action-failure";
import { Button } from "@/components/ui/button";
import type { AiActionProposal } from "@/lib/ai/actions/types";

export function AiActionProposalCard({
  proposal,
  onConfirm,
  onCancel,
  onEdit,
  onRetry,
}: {
  proposal: AiActionProposal;
  onConfirm: (proposalId: string) => void;
  onCancel: (proposalId: string) => void;
  onEdit: (proposalId: string) => void;
  onRetry: (proposalId: string) => void;
}) {
  const isActionable = proposal.status === "pending_confirmation";
  const isBusy = proposal.status === "validating" || proposal.status === "executing";

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{proposal.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{proposal.description}</p>
      </div>

      {!proposal.permissions.allowed && (
        <div className="flex items-start gap-1.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{proposal.permissions.reason ?? "Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz."}</span>
        </div>
      )}

      {proposal.before && proposal.before.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground uppercase">Önceki Durum</p>
          <div className="flex flex-col gap-1.5 opacity-70">
            {proposal.before.map((c) => (
              <AiActionFieldChange key={c.label} change={c} />
            ))}
          </div>
        </div>
      )}

      <div>
        {proposal.before && proposal.before.length > 0 && <p className="mb-1 text-[10px] font-semibold text-muted-foreground uppercase">Yeni Durum</p>}
        <div className="flex flex-col gap-1.5">
          {proposal.after.map((c) => (
            <AiActionFieldChange key={c.label} change={c} />
          ))}
        </div>
      </div>

      <AiActionValidationErrors errors={proposal.validation.errors} />
      <AiActionWarnings warnings={proposal.warnings} />

      <AiActionExecutionProgress status={proposal.status} />

      {proposal.status === "completed" && proposal.resultSummary && <AiActionResult summary={proposal.resultSummary} navigation={proposal.resultNavigation} />}
      {(proposal.status === "failed" || proposal.status === "invalid") && (proposal.errorMessage || proposal.resultSummary) && (
        <AiActionFailure message={proposal.errorMessage ?? proposal.resultSummary ?? "İşlem başarısız oldu."} onRetry={proposal.status === "failed" ? () => onRetry(proposal.id) : undefined} />
      )}
      {proposal.status === "cancelled" && <p className="text-xs text-muted-foreground">Bu işlem vazgeçildi.</p>}
      {proposal.status === "expired" && <p className="text-xs text-muted-foreground">Bu öneri süresi doldu, lütfen isteği tekrar yazın.</p>}

      {isActionable && proposal.validation.isValid && proposal.permissions.allowed && (
        <div className="flex flex-col gap-2">
          <AiActionConfirmButtons actionType={proposal.actionType} loading={isBusy} onConfirm={() => onConfirm(proposal.id)} onCancel={() => onCancel(proposal.id)} />
          <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(proposal.id)}>
            Düzenle
          </Button>
        </div>
      )}
      {isActionable && (!proposal.validation.isValid || !proposal.permissions.allowed) && (
        <AiActionConfirmButtons actionType={proposal.actionType} disabled onConfirm={() => {}} onCancel={() => onCancel(proposal.id)} />
      )}
    </div>
  );
}
