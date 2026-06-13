import type { RuntimeExecutionDecision } from './runtimeExecutionDecision.js';

export type RuntimeExecutionMountPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimeExecutionMountPreflightInput {
  decision: RuntimeExecutionDecision;
  proposedRoute: string;
  envGateName: string;
  confirmPhrase: string;
  operatorRunbookRef?: string;
}

export interface RuntimeExecutionMountPreflight {
  status: RuntimeExecutionMountPreflightStatus;
  executionMountPreflightReady: boolean;
  routeMutationAllowed: false;
  writeExecutionAllowed: false;
  proposedRoute: string;
  envGateName: string;
  contractTaskId: string;
  blockers: string[];
  reviewItems: string[];
  checklist: Array<{
    id: string;
    passed: boolean;
    detail: string;
  }>;
  nextActions: string[];
}

const ROUTE_RE = /^\/probe\/[a-z0-9-]+$/;
const ENV_RE = /^BLUEPILOT_[A-Z0-9_]+$/;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

export function preflightRuntimeExecutionMount(
  input: RuntimeExecutionMountPreflightInput,
): RuntimeExecutionMountPreflight {
  const proposedRoute = normalize(input.proposedRoute);
  const envGateName = normalize(input.envGateName);
  const confirmPhrase = normalize(input.confirmPhrase);
  const operatorRunbookRef = normalize(input.operatorRunbookRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decision.status === 'blocked') {
    blockers.push(...input.decision.blockers.map((blocker) => `runtime_mount_preflight.decision_blocked:${blocker}`));
  }
  if (input.decision.status === 'review_required') {
    reviewItems.push(...input.decision.reviewItems.map((item) => `runtime_mount_preflight.decision_review_required:${item}`));
  }
  if (!input.decision.runtimeExecutionAllowed) {
    blockers.push('runtime_mount_preflight.runtime_execution_not_allowed');
  }
  if (input.decision.writeExecutionAllowed !== false) {
    blockers.push('runtime_mount_preflight.write_execution_must_be_closed');
  }
  if (!ROUTE_RE.test(proposedRoute)) {
    blockers.push(`runtime_mount_preflight.invalid_route:${proposedRoute || '(missing)'}`);
  }
  if (proposedRoute === '/probe/dry-run' || proposedRoute === '/probe/runtime-dry-run') {
    blockers.push(`runtime_mount_preflight.existing_route_must_not_be_mutated:${proposedRoute}`);
  }
  if (!ENV_RE.test(envGateName)) {
    blockers.push(`runtime_mount_preflight.invalid_env_gate:${envGateName || '(missing)'}`);
  }
  if (confirmPhrase.length < 12) {
    blockers.push('runtime_mount_preflight.confirm_phrase_too_short');
  }
  if (!operatorRunbookRef) {
    reviewItems.push('runtime_mount_preflight.operator_runbook_ref_required');
  }

  const status: RuntimeExecutionMountPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    executionMountPreflightReady: status === 'ready',
    routeMutationAllowed: false,
    writeExecutionAllowed: false,
    proposedRoute,
    envGateName,
    contractTaskId: input.decision.contractTaskId,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    checklist: [
      {
        id: 'runtime_decision_ready',
        passed: input.decision.status === 'ready' && input.decision.runtimeExecutionAllowed,
        detail: input.decision.status,
      },
      {
        id: 'new_route_name',
        passed: ROUTE_RE.test(proposedRoute) && proposedRoute !== '/probe/dry-run' && proposedRoute !== '/probe/runtime-dry-run',
        detail: proposedRoute || 'missing',
      },
      {
        id: 'default_off_env_gate',
        passed: ENV_RE.test(envGateName),
        detail: envGateName || 'missing',
      },
      {
        id: 'operator_runbook_present',
        passed: Boolean(operatorRunbookRef),
        detail: operatorRunbookRef || 'missing',
      },
      {
        id: 'route_mutation_closed_in_preflight',
        passed: true,
        detail: 'preflight_only',
      },
    ],
    nextActions: status === 'ready'
      ? ['draft_separate_runtime_execution_mount_contract', 'keep_existing_routes_unchanged_until_contract']
      : status === 'review_required'
        ? ['complete_runtime_mount_preflight_review']
        : ['resolve_runtime_mount_preflight_blockers'],
  };
}
