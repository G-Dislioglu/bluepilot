import type { RuntimeDryRunAdapterPlan } from './runtimeDryRunAdapterContract.js';

export interface RuntimeDryRunRouteRequest {
  method: string;
  body?: {
    confirm?: string;
    instruction?: string;
    requestedBy?: string;
  };
}

export interface RuntimeDryRunRouteContractResponse {
  statusCode: 200 | 400 | 405 | 409;
  body: {
    ok: boolean;
    code: string;
    plan?: RuntimeDryRunAdapterPlan;
    reasons: string[];
  };
}

export const RUNTIME_DRY_RUN_CONFIRM = 'runtime-dry-run-contract-only';

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildRuntimeDryRunRouteContractResponse(
  request: RuntimeDryRunRouteRequest,
  plan: RuntimeDryRunAdapterPlan,
): RuntimeDryRunRouteContractResponse {
  const reasons: string[] = [];
  const method = normalize(request.method).toUpperCase();
  const confirm = normalize(request.body?.confirm);
  const instruction = normalize(request.body?.instruction);

  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: { ok: false, code: 'method_not_allowed', reasons: ['runtime_dry_run_route.post_required'] },
    };
  }
  if (confirm !== RUNTIME_DRY_RUN_CONFIRM) {
    reasons.push('runtime_dry_run_route.confirm_required');
  }
  if (!instruction) {
    reasons.push('runtime_dry_run_route.instruction_required');
  }
  if (instruction && instruction !== plan.instruction) {
    reasons.push('runtime_dry_run_route.instruction_plan_mismatch');
  }
  if (plan.status === 'blocked') {
    reasons.push(...plan.blockers.map((blocker) => `runtime_dry_run_route.plan_blocked:${blocker}`));
  }
  if (plan.status === 'review_required') {
    reasons.push(...plan.reviewItems.map((item) => `runtime_dry_run_route.plan_review_required:${item}`));
  }

  if (reasons.length > 0) {
    return {
      statusCode: plan.status === 'review_required' && reasons.every((reason) => reason.includes('plan_review_required')) ? 409 : 400,
      body: { ok: false, code: 'runtime_dry_run_route_not_ready', reasons: unique(reasons) },
    };
  }

  return {
    statusCode: 200,
    body: {
      ok: true,
      code: 'runtime_dry_run_route_ready',
      plan,
      reasons: [],
    },
  };
}
