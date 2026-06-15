import type { RuntimeExecutionRouteHandlerSkeletonResult } from './runtimeExecutionRouteHandlerSkeleton.js';
import type { RuntimeExecutionRouteMountContract } from './runtimeExecutionRouteMountContract.js';

export type RuntimeHandlerMountReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeHandlerMountReadinessInput {
  handlerResult: RuntimeExecutionRouteHandlerSkeletonResult;
  mountContract: RuntimeExecutionRouteMountContract;
  routeModuleRef?: string;
}

export interface RuntimeHandlerMountReadiness {
  status: RuntimeHandlerMountReadinessStatus;
  mountReadinessAllowed: boolean;
  executionAllowed: false;
  serverMutationAllowed: false;
  routeMutationAllowed: false;
  routePath: string;
  envGateName: string;
  handlerRef?: string;
  routeModuleRef?: string;
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

export function assessRuntimeHandlerMountReadiness(
  input: RuntimeHandlerMountReadinessInput,
): RuntimeHandlerMountReadiness {
  const routeModuleRef = normalize(input.routeModuleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.mountContract.status === 'blocked') {
    blockers.push(...input.mountContract.blockers.map((blocker) => `runtime_handler_mount.contract_blocked:${blocker}`));
  }
  if (input.mountContract.status === 'review_required') {
    reviewItems.push(...input.mountContract.reviewItems.map((item) => `runtime_handler_mount.contract_review_required:${item}`));
  }
  if (!input.mountContract.mountContractAllowed) {
    blockers.push('runtime_handler_mount.mount_contract_not_allowed');
  }
  if (input.mountContract.executionAllowed !== false) {
    blockers.push('runtime_handler_mount.contract_execution_must_stay_disabled');
  }
  if (input.mountContract.serverMutationAllowed !== false) {
    blockers.push('runtime_handler_mount.server_mutation_must_stay_closed');
  }
  if (input.handlerResult.statusCode !== 200 || !input.handlerResult.body.ok) {
    blockers.push(...input.handlerResult.body.reasons.map((reason) => `runtime_handler_mount.handler_not_ready:${reason}`));
  }
  if (input.handlerResult.body.executionAllowed !== false) {
    blockers.push('runtime_handler_mount.handler_execution_must_stay_disabled');
  }
  if (input.handlerResult.body.routeMutationAllowed !== false) {
    blockers.push('runtime_handler_mount.handler_route_mutation_must_stay_closed');
  }
  if (!routeModuleRef) {
    reviewItems.push('runtime_handler_mount.route_module_ref_required');
  }

  const status: RuntimeHandlerMountReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountReadinessAllowed: status === 'ready',
    executionAllowed: false,
    serverMutationAllowed: false,
    routeMutationAllowed: false,
    routePath: input.mountContract.routePath,
    envGateName: input.mountContract.envGateName,
    ...(input.mountContract.handlerRef ? { handlerRef: input.mountContract.handlerRef } : {}),
    ...(routeModuleRef ? { routeModuleRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_default_off_runtime_handler_mount_task']
      : status === 'review_required'
        ? ['complete_runtime_handler_mount_readiness_review']
        : ['resolve_runtime_handler_mount_readiness_blockers'],
  };
}
