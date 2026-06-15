import type { RuntimePatchPermitConsumeApplicationAuthority } from './runtimePatchPermitConsumeApplicationAuthority.js';

export type RuntimePatchPermitConsumeExecutionPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionPreflightInput {
  authority: RuntimePatchPermitConsumeApplicationAuthority;
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionPreflight {
  status: RuntimePatchPermitConsumeExecutionPreflightStatus;
  consumeExecutionPreflightAllowed: boolean;
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
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  consumeExecution: {
    kind: 'runtime_patch_permit_consume_execution_preflight';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
    applicationAuthorityRef?: string;
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

export function preflightRuntimePatchPermitConsumeExecution(
  input: RuntimePatchPermitConsumeExecutionPreflightInput,
): RuntimePatchPermitConsumeExecutionPreflight {
  const executionPreflightRef = normalize(input.executionPreflightRef);
  const executorRef = normalize(input.executorRef);
  const executionPolicyRef = normalize(input.executionPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `runtime_patch_permit_consume_execution_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `runtime_patch_permit_consume_execution_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeApplicationAuthorityAllowed || !input.authority.consumeApplicationAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_preflight.application_authority_not_allowed');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_preflight.consume_must_be_authorized');
  }
  if (!input.authority.permitIssued) {
    blockers.push('runtime_patch_permit_consume_execution_preflight.permit_must_be_issued');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executionExecuted !== false
    || input.authority.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!executionPreflightRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_preflight.execution_preflight_ref_required');
  }
  if (!executorRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_preflight.executor_ref_required');
  }
  if (!executionPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_preflight.execution_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionPreflightAllowed: status === 'ready',
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(executionPreflightRef ? { executionPreflightRef } : {}),
    ...(executorRef ? { executorRef } : {}),
    ...(executionPolicyRef ? { executionPolicyRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, executionPreflightRef, executionPolicyRef]),
    consumeExecution: {
      kind: 'runtime_patch_permit_consume_execution_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.applicationAuthorityId ? { applicationAuthorityRef: input.authority.applicationAuthorityId } : {}),
      ...(executionPolicyRef ? { policyRef: executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_preflight_blockers'],
  };
}
