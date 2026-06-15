import type { RuntimeMountImplementationPlan } from './runtimeMountImplementationPlan.js';

export type RuntimeMountPatchPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeMountPatchPreflightInput {
  plan: RuntimeMountImplementationPlan;
  proposedFiles: string[];
  routePath: string;
  envGateName: string;
  reviewerRef?: string;
  patchRef?: string;
  executionStillClosed?: boolean;
}

export interface RuntimeMountPatchPreflight {
  status: RuntimeMountPatchPreflightStatus;
  patchPreflightAllowed: boolean;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  patchRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function normalizeFiles(values: string[]): string[] {
  return [...new Set(values.map((value) => normalize(value).replace(/\\/g, '/')).filter(Boolean))];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function preflightRuntimeMountPatch(
  input: RuntimeMountPatchPreflightInput,
): RuntimeMountPatchPreflight {
  const routePath = normalize(input.routePath);
  const envGateName = normalize(input.envGateName);
  const reviewerRef = normalize(input.reviewerRef);
  const patchRef = normalize(input.patchRef);
  const proposedFiles = normalizeFiles(input.proposedFiles);
  const plannedFiles = new Set(input.plan.plannedFiles);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.plan.status === 'blocked') {
    blockers.push(...input.plan.blockers.map((blocker) => `runtime_mount_patch_preflight.plan_blocked:${blocker}`));
  }
  if (input.plan.status === 'review_required') {
    reviewItems.push(...input.plan.reviewItems.map((item) => `runtime_mount_patch_preflight.plan_review_required:${item}`));
  }
  if (!input.plan.implementationPlanAllowed) {
    blockers.push('runtime_mount_patch_preflight.plan_not_allowed');
  }
  if (input.plan.serverMutationExecuted !== false || input.plan.routeMutationExecuted !== false || input.plan.executionExecuted !== false) {
    blockers.push('runtime_mount_patch_preflight.plan_execution_or_mutation_must_not_be_executed');
  }
  if (input.executionStillClosed === false) {
    blockers.push('runtime_mount_patch_preflight.execution_must_remain_closed');
  }
  if (routePath !== input.plan.routePath) {
    blockers.push(`runtime_mount_patch_preflight.route_mismatch:${routePath}->${input.plan.routePath}`);
  }
  if (envGateName !== input.plan.envGateName) {
    blockers.push(`runtime_mount_patch_preflight.env_gate_mismatch:${envGateName}->${input.plan.envGateName}`);
  }
  for (const file of proposedFiles) {
    if (!plannedFiles.has(file)) {
      blockers.push(`runtime_mount_patch_preflight.unplanned_file:${file}`);
    }
  }
  if (!proposedFiles.includes('builder/src/server.ts')) {
    reviewItems.push('runtime_mount_patch_preflight.server_file_patch_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('runtime_mount_patch_preflight.reviewer_ref_required');
  }
  if (!patchRef) {
    reviewItems.push('runtime_mount_patch_preflight.patch_ref_required');
  }

  const status: RuntimeMountPatchPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    patchPreflightAllowed: status === 'ready',
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    ...(patchRef ? { patchRef } : {}),
    routePath,
    envGateName,
    proposedFiles,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_new_task_lock_for_runtime_mount_patch_application']
      : status === 'review_required'
        ? ['complete_runtime_mount_patch_preflight_review']
        : ['resolve_runtime_mount_patch_preflight_blockers'],
  };
}
