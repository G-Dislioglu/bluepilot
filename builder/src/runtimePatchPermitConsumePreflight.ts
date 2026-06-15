import type { RuntimePatchPermitIssueAuthority } from './runtimePatchPermitIssueAuthority.js';

export type RuntimePatchPermitConsumePreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumePreflightInput {
  authority: RuntimePatchPermitIssueAuthority;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
}

export interface RuntimePatchPermitConsumePreflight {
  status: RuntimePatchPermitConsumePreflightStatus;
  permitConsumePreflightAllowed: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  permitId?: string;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  permitConsume: {
    kind: 'runtime_patch_permit_consume_preflight';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
    authorityRef?: string;
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

export function preflightRuntimePatchPermitConsume(
  input: RuntimePatchPermitConsumePreflightInput,
): RuntimePatchPermitConsumePreflight {
  const consumeRef = normalize(input.consumeRef);
  const consumerRef = normalize(input.consumerRef);
  const consumePolicyRef = normalize(input.consumePolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `runtime_patch_permit_consume_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `runtime_patch_permit_consume_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.permitIssueAuthorityAllowed) {
    blockers.push('runtime_patch_permit_consume_preflight.authority_not_allowed');
  }
  if (!input.authority.permitIssued) {
    blockers.push('runtime_patch_permit_consume_preflight.permit_must_be_issued');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executionExecuted !== false
    || input.authority.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!consumeRef) {
    reviewItems.push('runtime_patch_permit_consume_preflight.consume_ref_required');
  }
  if (!consumerRef) {
    reviewItems.push('runtime_patch_permit_consume_preflight.consumer_ref_required');
  }
  if (!consumePolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_preflight.consume_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumePreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitConsumePreflightAllowed: status === 'ready',
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(consumeRef ? { consumeRef } : {}),
    ...(consumerRef ? { consumerRef } : {}),
    ...(consumePolicyRef ? { consumePolicyRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, consumeRef, consumePolicyRef]),
    permitConsume: {
      kind: 'runtime_patch_permit_consume_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.issuedByRef ? { authorityRef: input.authority.issuedByRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_preflight_review']
        : ['resolve_runtime_patch_permit_consume_preflight_blockers'],
  };
}
