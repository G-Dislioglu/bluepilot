import type { RuntimePatchOperatorDecisionGate } from './runtimePatchOperatorDecisionGate.js';

export type RuntimePatchApprovedActionPermitPrepStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchApprovedActionPermitPrepInput {
  decisionGate: RuntimePatchOperatorDecisionGate;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
}

export interface RuntimePatchApprovedActionPermitPrep {
  status: RuntimePatchApprovedActionPermitPrepStatus;
  permitPrepAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'runtime_patch_application';
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

export function prepareRuntimePatchApprovedActionPermit(
  input: RuntimePatchApprovedActionPermitPrepInput,
): RuntimePatchApprovedActionPermitPrep {
  const permitPrepRef = normalize(input.permitPrepRef);
  const requesterRef = normalize(input.requesterRef);
  const scopeRef = normalize(input.scopeRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `runtime_patch_permit_prep.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `runtime_patch_permit_prep.decision_review_required:${item}`));
  }
  if (!input.decisionGate.decisionGateAllowed) {
    blockers.push('runtime_patch_permit_prep.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('runtime_patch_permit_prep.decision_must_be_approve');
  }
  if (input.decisionGate.patchApplyAllowed !== false) {
    blockers.push('runtime_patch_permit_prep.patch_apply_must_stay_closed');
  }
  if (input.decisionGate.serverMutationExecuted !== false || input.decisionGate.routeMutationExecuted !== false) {
    blockers.push('runtime_patch_permit_prep.mutation_must_not_be_executed');
  }
  if (input.decisionGate.executionExecuted !== false || input.decisionGate.executionAllowed !== false) {
    blockers.push('runtime_patch_permit_prep.execution_must_stay_closed');
  }
  if (!permitPrepRef) {
    reviewItems.push('runtime_patch_permit_prep.permit_prep_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('runtime_patch_permit_prep.requester_ref_required');
  }
  if (!scopeRef) {
    reviewItems.push('runtime_patch_permit_prep.scope_ref_required');
  }

  const status: RuntimePatchApprovedActionPermitPrepStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitPrepAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(permitPrepRef ? { permitPrepRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    ...(scopeRef ? { scopeRef } : {}),
    routePath: input.decisionGate.routePath,
    envGateName: input.decisionGate.envGateName,
    proposedFiles: [...input.decisionGate.proposedFiles],
    evidenceRefs: [...input.decisionGate.evidenceRefs],
    permitRequest: {
      kind: 'runtime_patch_application',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.approvalRef ? { approvalRef: input.decisionGate.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_issuance']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_prep_review']
        : ['resolve_runtime_patch_permit_prep_blockers'],
  };
}
