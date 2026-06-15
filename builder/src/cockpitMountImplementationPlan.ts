import type { CockpitDefaultOffMountContract } from './cockpitDefaultOffMountContract.js';

export type CockpitMountImplementationPlanStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitMountImplementationPlanInput {
  contract: CockpitDefaultOffMountContract;
  reviewerRef?: string;
  implementationPlanRef?: string;
}

export interface CockpitMountImplementationPlan {
  status: CockpitMountImplementationPlanStatus;
  implementationPlanAllowed: boolean;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
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

export function planCockpitMountImplementation(
  input: CockpitMountImplementationPlanInput,
): CockpitMountImplementationPlan {
  const reviewerRef = normalize(input.reviewerRef);
  const implementationPlanRef = normalize(input.implementationPlanRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.contract.status === 'blocked') {
    blockers.push(...input.contract.blockers.map((blocker) => `cockpit_mount_plan.contract_blocked:${blocker}`));
  }
  if (input.contract.status === 'review_required') {
    reviewItems.push(...input.contract.reviewItems.map((item) => `cockpit_mount_plan.contract_review_required:${item}`));
  }
  if (!input.contract.mountContractAllowed) {
    blockers.push('cockpit_mount_plan.mount_contract_not_allowed');
  }
  if (input.contract.serverMutationAllowed !== false || input.contract.routeMutationAllowed !== false) {
    blockers.push('cockpit_mount_plan.contract_mutation_must_stay_closed');
  }
  if (input.contract.executableActionAllowed !== false) {
    blockers.push('cockpit_mount_plan.executable_actions_must_stay_disabled');
  }
  if (!input.contract.defaultOff) {
    blockers.push('cockpit_mount_plan.default_off_required');
  }
  if (!reviewerRef) {
    reviewItems.push('cockpit_mount_plan.reviewer_ref_required');
  }
  if (!implementationPlanRef) {
    reviewItems.push('cockpit_mount_plan.implementation_plan_ref_required');
  }

  const status: CockpitMountImplementationPlanStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    implementationPlanAllowed: status === 'ready',
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    routePath: input.contract.routePath,
    envGateName: input.contract.envGateName,
    ...(implementationPlanRef ? { implementationPlanRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    plannedFiles: ['builder/src/server.ts', input.contract.routeModuleRef ?? 'builder/src/cockpitReadOnlyRoute.ts'],
    requiredGates: [
      input.contract.envGateName,
      'visual_review_required_before_ui_claim',
      'actions_remain_disabled',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_new_task_lock_before_touching_server_or_route_files']
      : status === 'review_required'
        ? ['complete_cockpit_mount_implementation_plan_review']
        : ['resolve_cockpit_mount_implementation_plan_blockers'],
  };
}
