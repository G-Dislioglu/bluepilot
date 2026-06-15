import type { RuntimeExecutionRouteContractResponse } from './runtimeExecutionRouteContract.js';
import type { RuntimeExecutionMountPreflight } from './runtimeExecutionMountPreflight.js';

export type RuntimeExecutionRouteMountReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeExecutionRouteMountReadinessInput {
  preflight: RuntimeExecutionMountPreflight;
  contractResponse: RuntimeExecutionRouteContractResponse;
  mountRef?: string;
}

export interface RuntimeExecutionRouteMountReadiness {
  status: RuntimeExecutionRouteMountReadinessStatus;
  mountAllowed: boolean;
  executionAllowed: false;
  serverMutationAllowed: false;
  mountRef?: string;
  routePath: string;
  envGateName: string;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function assessRuntimeExecutionRouteMountReadiness(
  input: RuntimeExecutionRouteMountReadinessInput,
): RuntimeExecutionRouteMountReadiness {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const mountRef = normalize(input.mountRef);

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_mount_readiness.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_mount_readiness.preflight_review_required:${item}`));
  }
  if (!input.preflight.executionMountPreflightReady) {
    blockers.push('runtime_mount_readiness.preflight_not_ready');
  }
  if (!input.contractResponse.body.ok || input.contractResponse.statusCode !== 200) {
    blockers.push(...input.contractResponse.body.reasons.map((reason) => `runtime_mount_readiness.contract_not_ready:${reason}`));
  }
  if (input.contractResponse.body.executionAllowed !== false) {
    blockers.push('runtime_mount_readiness.execution_must_remain_disabled');
  }
  if (!mountRef) {
    reviewItems.push('runtime_mount_readiness.mount_ref_required');
  }

  const status: RuntimeExecutionRouteMountReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountAllowed: status === 'ready',
    executionAllowed: false,
    serverMutationAllowed: false,
    ...(mountRef ? { mountRef } : {}),
    routePath: input.preflight.proposedRoute,
    envGateName: input.preflight.envGateName,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_route_mount_contract', 'keep_execution_implementation_separate']
      : status === 'review_required'
        ? ['complete_runtime_mount_readiness_review']
        : ['resolve_runtime_mount_readiness_blockers'],
  };
}
