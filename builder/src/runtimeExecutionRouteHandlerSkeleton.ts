import {
  buildRuntimeExecutionRouteContractResponse,
  type RuntimeExecutionRouteContractRequest,
  type RuntimeExecutionRouteContractResponse,
} from './runtimeExecutionRouteContract.js';
import type { RuntimeExecutionRouteMountContract } from './runtimeExecutionRouteMountContract.js';
import type { RuntimeExecutionMountPreflight } from './runtimeExecutionMountPreflight.js';

export interface RuntimeExecutionRouteHandlerSkeletonResult extends RuntimeExecutionRouteContractResponse {
  body: RuntimeExecutionRouteContractResponse['body'] & {
    handlerRef?: string;
    routeMutationAllowed: false;
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function handleRuntimeExecutionRouteSkeleton(
  request: RuntimeExecutionRouteContractRequest,
  preflight: RuntimeExecutionMountPreflight,
  mountContract: RuntimeExecutionRouteMountContract,
): RuntimeExecutionRouteHandlerSkeletonResult {
  const reasons: string[] = [];

  if (mountContract.status === 'blocked') {
    reasons.push(...mountContract.blockers.map((blocker) => `runtime_execution_handler.mount_blocked:${blocker}`));
  }
  if (mountContract.status === 'review_required') {
    reasons.push(...mountContract.reviewItems.map((item) => `runtime_execution_handler.mount_review_required:${item}`));
  }
  if (!mountContract.mountContractAllowed) {
    reasons.push('runtime_execution_handler.mount_contract_not_allowed');
  }
  if (mountContract.executionAllowed !== false) {
    reasons.push('runtime_execution_handler.execution_must_stay_disabled');
  }
  if (mountContract.serverMutationAllowed !== false) {
    reasons.push('runtime_execution_handler.server_mutation_must_stay_closed');
  }
  if (mountContract.routePath !== preflight.proposedRoute) {
    reasons.push(`runtime_execution_handler.route_mismatch:${mountContract.routePath}->${preflight.proposedRoute}`);
  }
  if (mountContract.envGateName !== preflight.envGateName) {
    reasons.push(`runtime_execution_handler.env_gate_mismatch:${mountContract.envGateName}->${preflight.envGateName}`);
  }

  if (reasons.length > 0) {
    return {
      statusCode: mountContract.status === 'review_required' ? 409 : 400,
      body: {
        ok: false,
        code: 'runtime_execution_handler_not_ready',
        executionAllowed: false,
        routeMutationAllowed: false,
        ...(mountContract.handlerRef ? { handlerRef: mountContract.handlerRef } : {}),
        reasons: unique(reasons),
      },
    };
  }

  const contractResponse = buildRuntimeExecutionRouteContractResponse(request, preflight);
  return {
    ...contractResponse,
    body: {
      ...contractResponse.body,
      executionAllowed: false,
      routeMutationAllowed: false,
      ...(mountContract.handlerRef ? { handlerRef: mountContract.handlerRef } : {}),
      reasons: unique([
        ...contractResponse.body.reasons,
        'runtime_execution_handler.skeleton_only_no_execution',
      ]),
    },
  };
}
