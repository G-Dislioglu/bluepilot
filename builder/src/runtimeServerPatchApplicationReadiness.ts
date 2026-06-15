import type { RuntimeServerPatchCandidate } from './runtimeServerPatchCandidate.js';

export type RuntimeServerPatchApplicationReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeServerPatchApplicationReadinessInput {
  candidate: RuntimeServerPatchCandidate;
  readinessRef?: string;
  operatorApprovalRef?: string;
  diffRef?: string;
  executionClosedRef?: string;
}

export interface RuntimeServerPatchApplicationReadiness {
  status: RuntimeServerPatchApplicationReadinessStatus;
  applicationReadinessAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  readinessRef?: string;
  operatorApprovalRef?: string;
  diffRef?: string;
  executionClosedRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  guardChecks: string[];
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

export function assessRuntimeServerPatchApplicationReadiness(
  input: RuntimeServerPatchApplicationReadinessInput,
): RuntimeServerPatchApplicationReadiness {
  const readinessRef = normalize(input.readinessRef);
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const diffRef = normalize(input.diffRef);
  const executionClosedRef = normalize(input.executionClosedRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.candidate.status === 'blocked') {
    blockers.push(...input.candidate.blockers.map((blocker) => `runtime_patch_application_readiness.candidate_blocked:${blocker}`));
  }
  if (input.candidate.status === 'review_required') {
    reviewItems.push(...input.candidate.reviewItems.map((item) => `runtime_patch_application_readiness.candidate_review_required:${item}`));
  }
  if (!input.candidate.patchCandidateAllowed) {
    blockers.push('runtime_patch_application_readiness.candidate_not_allowed');
  }
  if (input.candidate.patchApplyAllowed !== false) {
    blockers.push('runtime_patch_application_readiness.patch_apply_must_stay_closed');
  }
  if (input.candidate.serverMutationExecuted !== false || input.candidate.routeMutationExecuted !== false) {
    blockers.push('runtime_patch_application_readiness.mutation_must_not_be_executed');
  }
  if (input.candidate.executionExecuted !== false || input.candidate.executionAllowed !== false) {
    blockers.push('runtime_patch_application_readiness.execution_must_stay_closed');
  }
  if (!readinessRef) {
    reviewItems.push('runtime_patch_application_readiness.readiness_ref_required');
  }
  if (!operatorApprovalRef) {
    reviewItems.push('runtime_patch_application_readiness.operator_approval_ref_required');
  }
  if (!diffRef) {
    reviewItems.push('runtime_patch_application_readiness.diff_ref_required');
  }
  if (!executionClosedRef) {
    reviewItems.push('runtime_patch_application_readiness.execution_closed_ref_required');
  }

  const status: RuntimeServerPatchApplicationReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    applicationReadinessAllowed: status === 'ready',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(readinessRef ? { readinessRef } : {}),
    ...(operatorApprovalRef ? { operatorApprovalRef } : {}),
    ...(diffRef ? { diffRef } : {}),
    ...(executionClosedRef ? { executionClosedRef } : {}),
    routePath: input.candidate.routePath,
    envGateName: input.candidate.envGateName,
    proposedFiles: [...input.candidate.proposedFiles],
    guardChecks: unique([
      ...input.candidate.guardChecks,
      'application_readiness_only',
      'patch_apply_allowed_false',
      'execution_allowed_false',
      'execution_closed_ref_required',
    ]),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_server_patch_application']
      : status === 'review_required'
        ? ['complete_runtime_patch_application_readiness_review']
        : ['resolve_runtime_patch_application_readiness_blockers'],
  };
}
