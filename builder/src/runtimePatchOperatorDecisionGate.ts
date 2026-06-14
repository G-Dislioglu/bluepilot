import type { RuntimePatchOperatorDryRunEvidence } from './runtimePatchOperatorDryRunEvidence.js';

export type RuntimePatchOperatorDecisionGateStatus = 'ready' | 'review_required' | 'blocked';
export type RuntimePatchOperatorDecision = 'approve' | 'defer' | 'reject';

export interface RuntimePatchOperatorDecisionGateInput {
  evidence: RuntimePatchOperatorDryRunEvidence;
  decision?: RuntimePatchOperatorDecision;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
}

export interface RuntimePatchOperatorDecisionGate {
  status: RuntimePatchOperatorDecisionGateStatus;
  decisionGateAllowed: boolean;
  decision?: RuntimePatchOperatorDecision;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
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

export function evaluateRuntimePatchOperatorDecisionGate(
  input: RuntimePatchOperatorDecisionGateInput,
): RuntimePatchOperatorDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const operatorRef = normalize(input.operatorRef);
  const approvalRef = normalize(input.approvalRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `runtime_patch_operator_decision.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `runtime_patch_operator_decision.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('runtime_patch_operator_decision.evidence_not_allowed');
  }
  if (input.evidence.patchApplyAllowed !== false) {
    blockers.push('runtime_patch_operator_decision.patch_apply_must_stay_closed');
  }
  if (input.evidence.serverMutationExecuted !== false || input.evidence.routeMutationExecuted !== false) {
    blockers.push('runtime_patch_operator_decision.mutation_must_not_be_executed');
  }
  if (input.evidence.executionExecuted !== false || input.evidence.executionAllowed !== false) {
    blockers.push('runtime_patch_operator_decision.execution_must_stay_closed');
  }
  if (input.decision === 'reject') {
    blockers.push('runtime_patch_operator_decision.operator_rejected');
  }
  if (!input.decision) {
    reviewItems.push('runtime_patch_operator_decision.decision_required');
  }
  if (input.decision === 'defer') {
    reviewItems.push('runtime_patch_operator_decision.operator_deferred');
  }
  if (!decisionRef) {
    reviewItems.push('runtime_patch_operator_decision.decision_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('runtime_patch_operator_decision.operator_ref_required');
  }
  if (input.decision === 'approve' && !approvalRef) {
    reviewItems.push('runtime_patch_operator_decision.approval_ref_required');
  }

  const status: RuntimePatchOperatorDecisionGateStatus = blockers.length > 0
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
    executionExecuted: false,
    executionAllowed: false,
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
      ? ['open_task_lock_for_runtime_patch_operator_approved_action']
      : status === 'review_required'
        ? ['complete_runtime_patch_operator_decision_review']
        : ['resolve_runtime_patch_operator_decision_blockers'],
  };
}
