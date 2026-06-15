import type { CockpitPatchApprovedActionPermitPrep } from './cockpitPatchApprovedActionPermitPrep.js';

export type CockpitPatchPermitPrepEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitPrepEvidenceInput {
  permitPrep: CockpitPatchApprovedActionPermitPrep;
  evidenceRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface CockpitPatchPermitPrepEvidence {
  status: CockpitPatchPermitPrepEvidenceStatus;
  evidencePackAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
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
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function buildCockpitPatchPermitPrepEvidence(
  input: CockpitPatchPermitPrepEvidenceInput,
): CockpitPatchPermitPrepEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const suppliedEvidenceRefs = unique((input.evidenceRefs ?? []).map((ref) => ref.trim()));
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.permitPrep.status === 'blocked') {
    blockers.push(...input.permitPrep.blockers.map((blocker) => `cockpit_patch_permit_prep_evidence.permit_prep_blocked:${blocker}`));
  }
  if (input.permitPrep.status === 'review_required') {
    reviewItems.push(...input.permitPrep.reviewItems.map((item) => `cockpit_patch_permit_prep_evidence.permit_prep_review_required:${item}`));
  }
  if (!input.permitPrep.permitPrepAllowed) {
    blockers.push('cockpit_patch_permit_prep_evidence.permit_prep_not_allowed');
  }
  if (input.permitPrep.permitIssued !== false) {
    blockers.push('cockpit_patch_permit_prep_evidence.permit_must_not_be_issued');
  }
  if (
    input.permitPrep.patchApplyAllowed !== false
    || input.permitPrep.serverMutationExecuted !== false
    || input.permitPrep.routeMutationExecuted !== false
    || input.permitPrep.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_prep_evidence.action_gates_must_stay_closed');
  }
  if (!evidenceRef) {
    reviewItems.push('cockpit_patch_permit_prep_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('cockpit_patch_permit_prep_evidence.reviewer_ref_required');
  }
  if (suppliedEvidenceRefs.length === 0) {
    reviewItems.push('cockpit_patch_permit_prep_evidence.evidence_refs_required');
  }

  const status: CockpitPatchPermitPrepEvidenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(evidenceRef ? { evidenceRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    routePath: input.permitPrep.routePath,
    envGateName: input.permitPrep.envGateName,
    proposedFiles: [...input.permitPrep.proposedFiles],
    evidenceRefs: unique([...input.permitPrep.evidenceRefs, ...suppliedEvidenceRefs, evidenceRef]),
    permitRequest: {
      kind: 'cockpit_patch_application',
      ...(input.permitPrep.permitRequest.decisionRef ? { decisionRef: input.permitPrep.permitRequest.decisionRef } : {}),
      ...(input.permitPrep.permitRequest.approvalRef ? { approvalRef: input.permitPrep.permitRequest.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_cockpit_patch_permit_prep_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_prep_evidence_review']
        : ['resolve_cockpit_patch_permit_prep_evidence_blockers'],
  };
}
