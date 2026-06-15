import type { CockpitPatchOperatorDryRunEvidence } from './cockpitPatchOperatorDryRunEvidence.js';

export type CockpitPatchOperatorDecisionGateStatus = 'ready' | 'review_required' | 'blocked';
export type CockpitPatchOperatorDecision = 'approve' | 'defer' | 'reject';

export interface CockpitPatchOperatorDecisionGateInput {
  evidence: CockpitPatchOperatorDryRunEvidence;
  decision?: CockpitPatchOperatorDecision;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
}

export interface CockpitPatchOperatorDecisionGate {
  status: CockpitPatchOperatorDecisionGateStatus;
  decisionGateAllowed: boolean;
  decision?: CockpitPatchOperatorDecision;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
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

export function evaluateCockpitPatchOperatorDecisionGate(
  input: CockpitPatchOperatorDecisionGateInput,
): CockpitPatchOperatorDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const operatorRef = normalize(input.operatorRef);
  const approvalRef = normalize(input.approvalRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `cockpit_patch_operator_decision.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `cockpit_patch_operator_decision.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('cockpit_patch_operator_decision.evidence_not_allowed');
  }
  if (input.evidence.patchApplyAllowed !== false) {
    blockers.push('cockpit_patch_operator_decision.patch_apply_must_stay_closed');
  }
  if (input.evidence.serverMutationExecuted !== false || input.evidence.routeMutationExecuted !== false) {
    blockers.push('cockpit_patch_operator_decision.mutation_must_not_be_executed');
  }
  if (input.evidence.executableActionAllowed !== false) {
    blockers.push('cockpit_patch_operator_decision.executable_actions_must_stay_disabled');
  }
  if (input.decision === 'reject') {
    blockers.push('cockpit_patch_operator_decision.operator_rejected');
  }
  if (!input.decision) {
    reviewItems.push('cockpit_patch_operator_decision.decision_required');
  }
  if (input.decision === 'defer') {
    reviewItems.push('cockpit_patch_operator_decision.operator_deferred');
  }
  if (!decisionRef) {
    reviewItems.push('cockpit_patch_operator_decision.decision_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('cockpit_patch_operator_decision.operator_ref_required');
  }
  if (input.decision === 'approve' && !approvalRef) {
    reviewItems.push('cockpit_patch_operator_decision.approval_ref_required');
  }

  const status: CockpitPatchOperatorDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    decisionGateAllowed: status === 'ready',
    ...(input.decision ? { decision: input.decision } : {}),
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(approvalRef ? { approvalRef } : {}),
    routePath: input.evidence.routePath,
    envGateName: input.evidence.envGateName,
    proposedFiles: [...input.evidence.proposedFiles],
    evidenceRefs: [...input.evidence.evidenceRefs],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_operator_approved_action']
      : status === 'review_required'
        ? ['complete_cockpit_patch_operator_decision_review']
        : ['resolve_cockpit_patch_operator_decision_blockers'],
  };
}
