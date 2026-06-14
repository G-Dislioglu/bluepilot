import type { ReleaseGovernanceHandoffPrepEvidence } from './releaseGovernanceHandoffPrepEvidence.js';

export type ReleaseGovernanceApprovedActionReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionReadinessInput {
  evidence: ReleaseGovernanceHandoffPrepEvidence;
  actionReadinessRef?: string;
  approverRef?: string;
  policyRef?: string;
}

export interface ReleaseGovernanceApprovedActionReadiness {
  status: ReleaseGovernanceApprovedActionReadinessStatus;
  approvedActionReadinessAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionReadinessRef?: string;
  approverRef?: string;
  policyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  handoffPacket: {
    kind: 'release_governance_approved_action';
    decisionRef?: string;
    approvalRef?: string;
  };
  actionGate: {
    kind: 'release_governance_approved_action_readiness';
    evidenceRef?: string;
    reviewerRef?: string;
    policyRef?: string;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function buildReleaseGovernanceApprovedActionReadiness(
  input: ReleaseGovernanceApprovedActionReadinessInput,
): ReleaseGovernanceApprovedActionReadiness {
  const actionReadinessRef = normalize(input.actionReadinessRef);
  const approverRef = normalize(input.approverRef);
  const policyRef = normalize(input.policyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `release_governance_approved_action_readiness.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `release_governance_approved_action_readiness.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('release_governance_approved_action_readiness.evidence_pack_not_allowed');
  }
  if (input.evidence.mergeAllowed !== false || input.evidence.externalActionAllowed !== false) {
    blockers.push('release_governance_approved_action_readiness.merge_and_external_actions_must_stay_closed');
  }
  if (!actionReadinessRef) {
    reviewItems.push('release_governance_approved_action_readiness.action_readiness_ref_required');
  }
  if (!approverRef) {
    reviewItems.push('release_governance_approved_action_readiness.approver_ref_required');
  }
  if (!policyRef) {
    reviewItems.push('release_governance_approved_action_readiness.policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    approvedActionReadinessAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(actionReadinessRef ? { actionReadinessRef } : {}),
    ...(approverRef ? { approverRef } : {}),
    ...(policyRef ? { policyRef } : {}),
    ...(input.evidence.releaseLabel ? { releaseLabel: input.evidence.releaseLabel } : {}),
    evidenceRefs: unique([...input.evidence.evidenceRefs, input.evidence.evidenceRef ?? '', policyRef]),
    runbookSteps: [...input.evidence.runbookSteps],
    handoffPacket: { ...input.evidence.handoffPacket },
    actionGate: {
      kind: 'release_governance_approved_action_readiness',
      ...(input.evidence.evidenceRef ? { evidenceRef: input.evidence.evidenceRef } : {}),
      ...(input.evidence.reviewerRef ? { reviewerRef: input.evidence.reviewerRef } : {}),
      ...(policyRef ? { policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_execution']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_readiness_review']
        : ['resolve_release_governance_approved_action_readiness_blockers'],
  };
}
