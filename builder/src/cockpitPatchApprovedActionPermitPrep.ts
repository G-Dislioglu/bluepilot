import type { CockpitPatchOperatorDecisionGate } from './cockpitPatchOperatorDecisionGate.js';

export type CockpitPatchApprovedActionPermitPrepStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchApprovedActionPermitPrepInput {
  decisionGate: CockpitPatchOperatorDecisionGate;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
}

export interface CockpitPatchApprovedActionPermitPrep {
  status: CockpitPatchApprovedActionPermitPrepStatus;
  permitPrepAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'cockpit_patch_application';
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

export function prepareCockpitPatchApprovedActionPermit(
  input: CockpitPatchApprovedActionPermitPrepInput,
): CockpitPatchApprovedActionPermitPrep {
  const permitPrepRef = normalize(input.permitPrepRef);
  const requesterRef = normalize(input.requesterRef);
  const scopeRef = normalize(input.scopeRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `cockpit_patch_permit_prep.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `cockpit_patch_permit_prep.decision_review_required:${item}`));
  }
  if (!input.decisionGate.decisionGateAllowed) {
    blockers.push('cockpit_patch_permit_prep.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('cockpit_patch_permit_prep.decision_must_be_approve');
  }
  if (input.decisionGate.patchApplyAllowed !== false) {
    blockers.push('cockpit_patch_permit_prep.patch_apply_must_stay_closed');
  }
  if (input.decisionGate.serverMutationExecuted !== false || input.decisionGate.routeMutationExecuted !== false) {
    blockers.push('cockpit_patch_permit_prep.mutation_must_not_be_executed');
  }
  if (input.decisionGate.executableActionAllowed !== false) {
    blockers.push('cockpit_patch_permit_prep.executable_actions_must_stay_disabled');
  }
  if (!permitPrepRef) {
    reviewItems.push('cockpit_patch_permit_prep.permit_prep_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('cockpit_patch_permit_prep.requester_ref_required');
  }
  if (!scopeRef) {
    reviewItems.push('cockpit_patch_permit_prep.scope_ref_required');
  }

  const status: CockpitPatchApprovedActionPermitPrepStatus = blockers.length > 0
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
    executableActionAllowed: false,
    ...(permitPrepRef ? { permitPrepRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    ...(scopeRef ? { scopeRef } : {}),
    routePath: input.decisionGate.routePath,
    envGateName: input.decisionGate.envGateName,
    proposedFiles: [...input.decisionGate.proposedFiles],
    evidenceRefs: [...input.decisionGate.evidenceRefs],
    permitRequest: {
      kind: 'cockpit_patch_application',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.approvalRef ? { approvalRef: input.decisionGate.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_issuance']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_prep_review']
        : ['resolve_cockpit_patch_permit_prep_blockers'],
  };
}
