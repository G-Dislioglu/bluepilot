import type { ReleaseGovernanceRunbookEvidence } from './releaseGovernanceRunbookEvidence.js';

export type ReleaseGovernanceFinalDecisionGateStatus = 'ready' | 'review_required' | 'blocked';
export type ReleaseGovernanceFinalDecision = 'approve' | 'defer' | 'reject';

export interface ReleaseGovernanceFinalDecisionGateInput {
  evidence: ReleaseGovernanceRunbookEvidence;
  decision?: ReleaseGovernanceFinalDecision;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
}

export interface ReleaseGovernanceFinalDecisionGate {
  status: ReleaseGovernanceFinalDecisionGateStatus;
  finalDecisionGateAllowed: boolean;
  decision?: ReleaseGovernanceFinalDecision;
  mergeAllowed: false;
  externalActionAllowed: false;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function evaluateReleaseGovernanceFinalDecisionGate(
  input: ReleaseGovernanceFinalDecisionGateInput,
): ReleaseGovernanceFinalDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const operatorRef = normalize(input.operatorRef);
  const approvalRef = normalize(input.approvalRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `release_final_decision.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `release_final_decision.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('release_final_decision.evidence_not_allowed');
  }
  if (input.evidence.mergeAllowed !== false || input.evidence.externalActionAllowed !== false) {
    blockers.push('release_final_decision.merge_and_external_actions_must_stay_closed');
  }
  if (input.decision === 'reject') {
    blockers.push('release_final_decision.operator_rejected');
  }
  if (!input.decision) {
    reviewItems.push('release_final_decision.decision_required');
  }
  if (input.decision === 'defer') {
    reviewItems.push('release_final_decision.operator_deferred');
  }
  if (!decisionRef) {
    reviewItems.push('release_final_decision.decision_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('release_final_decision.operator_ref_required');
  }
  if (input.decision === 'approve' && !approvalRef) {
    reviewItems.push('release_final_decision.approval_ref_required');
  }

  const status: ReleaseGovernanceFinalDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    finalDecisionGateAllowed: status === 'ready',
    ...(input.decision ? { decision: input.decision } : {}),
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(approvalRef ? { approvalRef } : {}),
    ...(input.evidence.releaseLabel ? { releaseLabel: input.evidence.releaseLabel } : {}),
    evidenceRefs: [...input.evidence.evidenceRefs],
    runbookSteps: [...input.evidence.runbookSteps],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_operator_approved_action']
      : status === 'review_required'
        ? ['complete_release_governance_final_decision_review']
        : ['resolve_release_governance_final_decision_blockers'],
  };
}
