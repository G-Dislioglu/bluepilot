import type { CockpitPatchPermitIssuePreflight } from './cockpitPatchPermitIssuePreflight.js';

export type CockpitPatchPermitIssueAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitIssueAuthorityInput {
  preflight: CockpitPatchPermitIssuePreflight;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
}

export interface CockpitPatchPermitIssueAuthority {
  status: CockpitPatchPermitIssueAuthorityStatus;
  permitIssueAuthorityAllowed: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  issuedPermit: {
    kind: 'cockpit_patch_application_permit';
    permitKind: 'cockpit_patch_application';
    preflightRef?: string;
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

export function issueCockpitPatchPermitAuthority(
  input: CockpitPatchPermitIssueAuthorityInput,
): CockpitPatchPermitIssueAuthority {
  const permitId = normalize(input.permitId);
  const issuedByRef = normalize(input.issuedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_patch_permit_issue_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_patch_permit_issue_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitIssuePreflightAllowed) {
    blockers.push('cockpit_patch_permit_issue_authority.preflight_not_allowed');
  }
  if (
    input.preflight.permitIssued !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_issue_authority.action_gates_must_stay_closed');
  }
  if (!permitId) {
    reviewItems.push('cockpit_patch_permit_issue_authority.permit_id_required');
  }
  if (!issuedByRef) {
    reviewItems.push('cockpit_patch_permit_issue_authority.issued_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('cockpit_patch_permit_issue_authority.expires_at_ref_required');
  }

  const status: CockpitPatchPermitIssueAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssueAuthorityAllowed: status === 'ready',
    permitIssued: status === 'ready',
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(permitId ? { permitId } : {}),
    ...(issuedByRef ? { issuedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, permitId, expiresAtRef]),
    issuedPermit: {
      kind: 'cockpit_patch_application_permit',
      permitKind: 'cockpit_patch_application',
      ...(input.preflight.preflightRef ? { preflightRef: input.preflight.preflightRef } : {}),
      ...(input.preflight.issuePolicyRef ? { policyRef: input.preflight.issuePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_issue_authority_review']
        : ['resolve_cockpit_patch_permit_issue_authority_blockers'],
  };
}
