import type { RuntimePatchPermitIssuePreflight } from './runtimePatchPermitIssuePreflight.js';

export type RuntimePatchPermitIssueAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitIssueAuthorityInput {
  preflight: RuntimePatchPermitIssuePreflight;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitIssueAuthority {
  status: RuntimePatchPermitIssueAuthorityStatus;
  permitIssueAuthorityAllowed: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  issuedPermit: {
    kind: 'runtime_patch_application_permit';
    permitKind: 'runtime_patch_application';
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

export function issueRuntimePatchPermitAuthority(
  input: RuntimePatchPermitIssueAuthorityInput,
): RuntimePatchPermitIssueAuthority {
  const permitId = normalize(input.permitId);
  const issuedByRef = normalize(input.issuedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_issue_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_issue_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitIssuePreflightAllowed) {
    blockers.push('runtime_patch_permit_issue_authority.preflight_not_allowed');
  }
  if (
    input.preflight.permitIssued !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executionExecuted !== false
    || input.preflight.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_issue_authority.runtime_action_gates_must_stay_closed');
  }
  if (!permitId) {
    reviewItems.push('runtime_patch_permit_issue_authority.permit_id_required');
  }
  if (!issuedByRef) {
    reviewItems.push('runtime_patch_permit_issue_authority.issued_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_issue_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitIssueAuthorityStatus = blockers.length > 0
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
    executionExecuted: false,
    executionAllowed: false,
    ...(permitId ? { permitId } : {}),
    ...(issuedByRef ? { issuedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, permitId, expiresAtRef]),
    issuedPermit: {
      kind: 'runtime_patch_application_permit',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.preflightRef ? { preflightRef: input.preflight.preflightRef } : {}),
      ...(input.preflight.issuePolicyRef ? { policyRef: input.preflight.issuePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_issue_authority_review']
        : ['resolve_runtime_patch_permit_issue_authority_blockers'],
  };
}
