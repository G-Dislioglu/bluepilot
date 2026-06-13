import type { RuntimeDefaultOffMountContract } from './runtimeDefaultOffMountContract.js';

export type RuntimeMountImplementationPlanStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeMountImplementationPlanInput {
  contract: RuntimeDefaultOffMountContract;
  reviewerRef?: string;
  implementationPlanRef?: string;
}

export interface RuntimeMountImplementationPlan {
  status: RuntimeMountImplementationPlanStatus;
  implementationPlanAllowed: boolean;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  routePath: string;
  envGateName: string;
  implementationPlanRef?: string;
  reviewerRef?: string;
  plannedFiles: string[];
  requiredGates: string[];
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

export function planRuntimeMountImplementation(
  input: RuntimeMountImplementationPlanInput,
): RuntimeMountImplementationPlan {
  const reviewerRef = normalize(input.reviewerRef);
  const implementationPlanRef = normalize(input.implementationPlanRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.contract.status === 'blocked') {
    blockers.push(...input.contract.blockers.map((blocker) => `runtime_mount_plan.contract_blocked:${blocker}`));
  }
  if (input.contract.status === 'review_required') {
    reviewItems.push(...input.contract.reviewItems.map((item) => `runtime_mount_plan.contract_review_required:${item}`));
  }
  if (!input.contract.mountContractAllowed) {
    blockers.push('runtime_mount_plan.mount_contract_not_allowed');
  }
  if (input.contract.executionAllowed !== false) {
    blockers.push('runtime_mount_plan.execution_must_stay_disabled');
  }
  if (input.contract.serverMutationAllowed !== false || input.contract.routeMutationAllowed !== false) {
    blockers.push('runtime_mount_plan.contract_mutation_must_stay_closed');
  }
  if (!input.contract.defaultOff) {
    blockers.push('runtime_mount_plan.default_off_required');
  }
  if (!reviewerRef) {
    reviewItems.push('runtime_mount_plan.reviewer_ref_required');
  }
  if (!implementationPlanRef) {
    reviewItems.push('runtime_mount_plan.implementation_plan_ref_required');
  }

  const status: RuntimeMountImplementationPlanStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    implementationPlanAllowed: status === 'ready',
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    routePath: input.contract.routePath,
    envGateName: input.contract.envGateName,
    ...(implementationPlanRef ? { implementationPlanRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    plannedFiles: ['builder/src/server.ts', input.contract.routeModuleRef ?? 'builder/src/runtimeExecutionRoute.ts'],
    requiredGates: [
      input.contract.envGateName,
      'runtime_execution_allowed_false_until_separate_contract',
      'operator_runbook_required',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_new_task_lock_before_touching_server_or_runtime_route_files']
      : status === 'review_required'
        ? ['complete_runtime_mount_implementation_plan_review']
        : ['resolve_runtime_mount_implementation_plan_blockers'],
  };
}
