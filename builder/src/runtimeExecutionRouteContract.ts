import type { RuntimeExecutionMountPreflight } from './runtimeExecutionMountPreflight.js';

export interface RuntimeExecutionRouteContractRequest {
  method: string;
  envEnabled?: boolean;
  route: string;
  body?: {
    confirm?: string;
    instruction?: string;
    requestedBy?: string;
  };
}

export interface RuntimeExecutionRouteContractResponse {
  statusCode: 200 | 400 | 403 | 405 | 409;
  body: {
    ok: boolean;
    code: string;
    executionAllowed: false;
    reasons: string[];
    preflight?: RuntimeExecutionMountPreflight;
  };
}

export const RUNTIME_EXECUTION_ROUTE_CONFIRM = 'runtime-dry-run-execution-contract';

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildRuntimeExecutionRouteContractResponse(
  request: RuntimeExecutionRouteContractRequest,
  preflight: RuntimeExecutionMountPreflight,
): RuntimeExecutionRouteContractResponse {
  const method = normalize(request.method).toUpperCase();
  const route = normalize(request.route);
  const confirm = normalize(request.body?.confirm);
  const instruction = normalize(request.body?.instruction);
  const reasons: string[] = [];

  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: {
        ok: false,
        code: 'method_not_allowed',
        executionAllowed: false,
        reasons: ['runtime_execution_route.post_required'],
      },
    };
  }
  if (!request.envEnabled) {
    return {
      statusCode: 403,
      body: {
        ok: false,
        code: 'runtime_execution_route_disabled',
        executionAllowed: false,
        reasons: ['runtime_execution_route.env_gate_required'],
      },
    };
  }
  if (route !== preflight.proposedRoute) {
    reasons.push(`runtime_execution_route.route_mismatch:${route}->${preflight.proposedRoute}`);
  }
  if (confirm !== RUNTIME_EXECUTION_ROUTE_CONFIRM) {
    reasons.push('runtime_execution_route.confirm_required');
  }
  if (!instruction) {
    reasons.push('runtime_execution_route.instruction_required');
  }
  if (preflight.status === 'blocked') {
    reasons.push(...preflight.blockers.map((blocker) => `runtime_execution_route.preflight_blocked:${blocker}`));
  }
  if (preflight.status === 'review_required') {
    reasons.push(...preflight.reviewItems.map((item) => `runtime_execution_route.preflight_review_required:${item}`));
  }
  if (!preflight.executionMountPreflightReady) {
    reasons.push('runtime_execution_route.preflight_not_ready');
  }

  if (reasons.length > 0) {
    return {
      statusCode: preflight.status === 'review_required' && reasons.every((reason) => reason.includes('preflight_review_required')) ? 409 : 400,
      body: {
        ok: false,
        code: 'runtime_execution_route_not_ready',
        executionAllowed: false,
        reasons: unique(reasons),
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      ok: true,
      code: 'runtime_execution_route_contract_ready',
      executionAllowed: false,
      reasons: ['runtime_execution_route.contract_only_no_execution'],
      preflight,
    },
  };
}
