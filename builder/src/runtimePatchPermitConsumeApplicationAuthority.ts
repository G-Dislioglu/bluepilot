import type { RuntimePatchPermitConsumeApplicationPreflight } from './runtimePatchPermitConsumeApplicationPreflight.js';

export type RuntimePatchPermitConsumeApplicationAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeApplicationAuthorityInput {
  preflight: RuntimePatchPermitConsumeApplicationPreflight;
  applicationAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitConsumeApplicationAuthority {
  status: RuntimePatchPermitConsumeApplicationAuthorityStatus;
  consumeApplicationAuthorityAllowed: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedApplication: {
    kind: 'runtime_patch_permit_consume_application_authority';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
    applicationRef?: string;
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

export function authorizeRuntimePatchPermitConsumeApplication(
  input: RuntimePatchPermitConsumeApplicationAuthorityInput,
): RuntimePatchPermitConsumeApplicationAuthority {
  const applicationAuthorityId = normalize(input.applicationAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_consume_application_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_consume_application_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeApplicationPreflightAllowed) {
    blockers.push('runtime_patch_permit_consume_application_authority.preflight_not_allowed');
  }
  if (!input.preflight.permitConsumeAuthorized) {
    blockers.push('runtime_patch_permit_consume_application_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executionExecuted !== false
    || input.preflight.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_application_authority.runtime_action_gates_must_stay_closed');
  }
  if (!applicationAuthorityId) {
    reviewItems.push('runtime_patch_permit_consume_application_authority.application_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('runtime_patch_permit_consume_application_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_consume_application_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitConsumeApplicationAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeApplicationAuthorityAllowed: status === 'ready',
    consumeApplicationAuthorized: status === 'ready',
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(applicationAuthorityId ? { applicationAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, applicationAuthorityId, expiresAtRef]),
    authorizedApplication: {
      kind: 'runtime_patch_permit_consume_application_authority',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.applicationRef ? { applicationRef: input.preflight.applicationRef } : {}),
      ...(input.preflight.applicationPolicyRef ? { policyRef: input.preflight.applicationPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_application_authority_review']
        : ['resolve_runtime_patch_permit_consume_application_authority_blockers'],
  };
}
