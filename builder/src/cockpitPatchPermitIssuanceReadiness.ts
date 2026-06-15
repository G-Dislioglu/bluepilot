import type { CockpitPatchPermitPrepEvidence } from './cockpitPatchPermitPrepEvidence.js';

export type CockpitPatchPermitIssuanceReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitIssuanceReadinessInput {
  evidence: CockpitPatchPermitPrepEvidence;
  issuanceReadinessRef?: string;
  issuerRef?: string;
  policyRef?: string;
}

export interface CockpitPatchPermitIssuanceReadiness {
  status: CockpitPatchPermitIssuanceReadinessStatus;
  permitIssuanceReadinessAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  issuanceReadinessRef?: string;
  issuerRef?: string;
  policyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'cockpit_patch_application';
    decisionRef?: string;
    approvalRef?: string;
  };
  issuanceGate: {
    kind: 'cockpit_patch_permit_issuance';
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

export function buildCockpitPatchPermitIssuanceReadiness(
  input: CockpitPatchPermitIssuanceReadinessInput,
): CockpitPatchPermitIssuanceReadiness {
  const issuanceReadinessRef = normalize(input.issuanceReadinessRef);
  const issuerRef = normalize(input.issuerRef);
  const policyRef = normalize(input.policyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `cockpit_patch_permit_issuance_readiness.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `cockpit_patch_permit_issuance_readiness.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('cockpit_patch_permit_issuance_readiness.evidence_pack_not_allowed');
  }
  if (
    input.evidence.permitIssued !== false
    || input.evidence.patchApplyAllowed !== false
    || input.evidence.serverMutationExecuted !== false
    || input.evidence.routeMutationExecuted !== false
    || input.evidence.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_issuance_readiness.action_gates_must_stay_closed');
  }
  if (!issuanceReadinessRef) {
    reviewItems.push('cockpit_patch_permit_issuance_readiness.issuance_readiness_ref_required');
  }
  if (!issuerRef) {
    reviewItems.push('cockpit_patch_permit_issuance_readiness.issuer_ref_required');
  }
  if (!policyRef) {
    reviewItems.push('cockpit_patch_permit_issuance_readiness.policy_ref_required');
  }

  const status: CockpitPatchPermitIssuanceReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssuanceReadinessAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(issuanceReadinessRef ? { issuanceReadinessRef } : {}),
    ...(issuerRef ? { issuerRef } : {}),
    ...(policyRef ? { policyRef } : {}),
    routePath: input.evidence.routePath,
    envGateName: input.evidence.envGateName,
    proposedFiles: [...input.evidence.proposedFiles],
    evidenceRefs: unique([...input.evidence.evidenceRefs, input.evidence.evidenceRef ?? '', policyRef]),
    permitRequest: { ...input.evidence.permitRequest },
    issuanceGate: {
      kind: 'cockpit_patch_permit_issuance',
      ...(input.evidence.evidenceRef ? { evidenceRef: input.evidence.evidenceRef } : {}),
      ...(input.evidence.reviewerRef ? { reviewerRef: input.evidence.reviewerRef } : {}),
      ...(policyRef ? { policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_issuance']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_issuance_readiness_review']
        : ['resolve_cockpit_patch_permit_issuance_readiness_blockers'],
  };
}
