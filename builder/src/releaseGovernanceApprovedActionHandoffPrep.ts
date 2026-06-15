import type { ReleaseGovernanceFinalDecisionGate } from './releaseGovernanceFinalDecisionGate.js';

export type ReleaseGovernanceApprovedActionHandoffPrepStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionHandoffPrepInput {
  finalDecisionGate: ReleaseGovernanceFinalDecisionGate;
  handoffPrepRef?: string;
  operatorRef?: string;
  recipientRef?: string;
}

export interface ReleaseGovernanceApprovedActionHandoffPrep {
  status: ReleaseGovernanceApprovedActionHandoffPrepStatus;
  handoffPrepAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  handoffPrepRef?: string;
  operatorRef?: string;
  recipientRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  handoffPacket: {
    kind: 'release_governance_approved_action';
    decisionRef?: string;
    approvalRef?: string;
  };
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

export function prepareReleaseGovernanceApprovedActionHandoff(
  input: ReleaseGovernanceApprovedActionHandoffPrepInput,
): ReleaseGovernanceApprovedActionHandoffPrep {
  const handoffPrepRef = normalize(input.handoffPrepRef);
  const operatorRef = normalize(input.operatorRef);
  const recipientRef = normalize(input.recipientRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.finalDecisionGate.status === 'blocked') {
    blockers.push(...input.finalDecisionGate.blockers.map((blocker) => `release_approved_handoff_prep.final_decision_blocked:${blocker}`));
  }
  if (input.finalDecisionGate.status === 'review_required') {
    reviewItems.push(...input.finalDecisionGate.reviewItems.map((item) => `release_approved_handoff_prep.final_decision_review_required:${item}`));
  }
  if (!input.finalDecisionGate.finalDecisionGateAllowed) {
    blockers.push('release_approved_handoff_prep.final_decision_not_allowed');
  }
  if (input.finalDecisionGate.decision !== 'approve') {
    blockers.push('release_approved_handoff_prep.decision_must_be_approve');
  }
  if (input.finalDecisionGate.mergeAllowed !== false || input.finalDecisionGate.externalActionAllowed !== false) {
    blockers.push('release_approved_handoff_prep.merge_and_external_actions_must_stay_closed');
  }
  if (!handoffPrepRef) {
    reviewItems.push('release_approved_handoff_prep.handoff_prep_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('release_approved_handoff_prep.operator_ref_required');
  }
  if (!recipientRef) {
    reviewItems.push('release_approved_handoff_prep.recipient_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionHandoffPrepStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    handoffPrepAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(handoffPrepRef ? { handoffPrepRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(recipientRef ? { recipientRef } : {}),
    ...(input.finalDecisionGate.releaseLabel ? { releaseLabel: input.finalDecisionGate.releaseLabel } : {}),
    evidenceRefs: [...input.finalDecisionGate.evidenceRefs],
    runbookSteps: [...input.finalDecisionGate.runbookSteps],
    handoffPacket: {
      kind: 'release_governance_approved_action',
      ...(input.finalDecisionGate.decisionRef ? { decisionRef: input.finalDecisionGate.decisionRef } : {}),
      ...(input.finalDecisionGate.approvalRef ? { approvalRef: input.finalDecisionGate.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_handoff']
      : status === 'review_required'
        ? ['complete_release_approved_handoff_prep_review']
        : ['resolve_release_approved_handoff_prep_blockers'],
  };
}
