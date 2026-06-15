import type { RuntimePatchPermitConsumePreflight } from './runtimePatchPermitConsumePreflight.js';

export type RuntimePatchPermitConsumeAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeAuthorityInput {
  preflight: RuntimePatchPermitConsumePreflight;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitConsumeAuthority {
  status: RuntimePatchPermitConsumeAuthorityStatus;
  permitConsumeAuthorityAllowed: boolean;
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
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedConsume: {
    kind: 'runtime_patch_permit_consume_authority';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
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

export function authorizeRuntimePatchPermitConsume(
  input: RuntimePatchPermitConsumeAuthorityInput,
): RuntimePatchPermitConsumeAuthority {
  const consumeAuthorityId = normalize(input.consumeAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_consume_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_consume_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitConsumePreflightAllowed) {
    blockers.push('runtime_patch_permit_consume_authority.preflight_not_allowed');
  }
  if (!input.preflight.permitIssued) {
    blockers.push('runtime_patch_permit_consume_authority.permit_must_be_issued');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executionExecuted !== false
    || input.preflight.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_authority.runtime_action_gates_must_stay_closed');
  }
  if (!consumeAuthorityId) {
    reviewItems.push('runtime_patch_permit_consume_authority.consume_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('runtime_patch_permit_consume_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_consume_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitConsumeAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitConsumeAuthorityAllowed: status === 'ready',
    permitConsumeAuthorized: status === 'ready',
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(consumeAuthorityId ? { consumeAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, consumeAuthorityId, expiresAtRef]),
    authorizedConsume: {
      kind: 'runtime_patch_permit_consume_authority',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.consumeRef ? { preflightRef: input.preflight.consumeRef } : {}),
      ...(input.preflight.consumePolicyRef ? { policyRef: input.preflight.consumePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_application_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_authority_review']
        : ['resolve_runtime_patch_permit_consume_authority_blockers'],
  };
}
