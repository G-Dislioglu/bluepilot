import {
  buildActivationLockPreflight,
  type ActivationLockRequest,
} from './activationLockBoundary.js';

export interface RuntimeDryRunExecutorMountLockRequest {
  confirm?: unknown;
  operatorExecutionRef?: unknown;
  routeGateRef?: unknown;
  runtimeMountRef?: unknown;
  activationLock?: ActivationLockRequest;
}

export interface RuntimeDryRunExecutorMountLockSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  deploys: false;
  merges: false;
  routeMutation: false;
  permitsIssued: false;
}

export interface RuntimeDryRunExecutorMountLockContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-runtime-dry-run-executor-mount-lock-contract-v0.1';
  generatedAt: string;
  upstreamLock: '/probe/activation-lock-preflight';
  protectedTarget: 'runtime_dry_run';
  requiredEvidence: string[];
  mountBoundary: {
    runtimeExecutionAllowed: false;
    routeMutationAllowed: false;
    providerCallsAllowed: false;
    writesAllowed: false;
    deployAllowed: false;
  };
  sideEffects: RuntimeDryRunExecutorMountLockSideEffects;
}

export interface RuntimeDryRunExecutorMountLockPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-runtime-dry-run-executor-mount-lock-preflight-v0.1';
  generatedAt: string;
  status: 'executor_mount_lock_ready' | 'review_required' | 'blocked';
  blockers: string[];
  reviewItems: string[];
  executorMountReady: boolean;
  runtimeExecutionAllowed: false;
  routeMutationAllowed: false;
  providerCallsAllowed: false;
  writesAllowed: false;
  deployAllowed: false;
  activationLockPreflight?: ReturnType<typeof buildActivationLockPreflight>;
  nextStep: string;
  contract: RuntimeDryRunExecutorMountLockContract;
  sideEffects: RuntimeDryRunExecutorMountLockSideEffects;
}

export const RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM = 'mount-runtime-dry-run-executor-review-only';

const REQUIRED_EVIDENCE = [
  'confirm',
  'operatorExecutionRef',
  'routeGateRef',
  'runtimeMountRef',
  'activationLock.activation_lock_ready',
  'activationLock.target.runtime_dry_run',
];

function lockedSideEffects(): RuntimeDryRunExecutorMountLockSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    databaseWrites: false,
    deploys: false,
    merges: false,
    routeMutation: false,
    permitsIssued: false,
  };
}

export function buildRuntimeDryRunExecutorMountLockContract(
  now = new Date(),
): RuntimeDryRunExecutorMountLockContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-runtime-dry-run-executor-mount-lock-contract-v0.1',
    generatedAt: now.toISOString(),
    upstreamLock: '/probe/activation-lock-preflight',
    protectedTarget: 'runtime_dry_run',
    requiredEvidence: REQUIRED_EVIDENCE,
    mountBoundary: {
      runtimeExecutionAllowed: false,
      routeMutationAllowed: false,
      providerCallsAllowed: false,
      writesAllowed: false,
      deployAllowed: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildRuntimeDryRunExecutorMountLockPreflight(
  request: RuntimeDryRunExecutorMountLockRequest,
  now = new Date(),
): RuntimeDryRunExecutorMountLockPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const confirm = normalizeString(request.confirm);
  const operatorExecutionRef = normalizeString(request.operatorExecutionRef);
  const routeGateRef = normalizeString(request.routeGateRef);
  const runtimeMountRef = normalizeString(request.runtimeMountRef);
  let activationLockPreflight: ReturnType<typeof buildActivationLockPreflight> | undefined;

  if (confirm !== RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM) {
    blockers.push('runtime_executor_mount.confirm_required');
  }
  requireRef(operatorExecutionRef, 'runtime_executor_mount.operator_execution_ref_required', blockers);
  requireRef(routeGateRef, 'runtime_executor_mount.route_gate_ref_required', blockers);
  requireRef(runtimeMountRef, 'runtime_executor_mount.runtime_mount_ref_required', blockers);

  if (!request.activationLock) {
    blockers.push('runtime_executor_mount.activation_lock_required');
  } else {
    activationLockPreflight = buildActivationLockPreflight({
      ...request.activationLock,
      target: 'runtime_dry_run',
    }, now);

    if (activationLockPreflight.status === 'blocked') {
      blockers.push(...activationLockPreflight.blockers.map((blocker) => `runtime_executor_mount.activation_lock_blocked:${blocker}`));
    }
    if (activationLockPreflight.status === 'review_required') {
      reviewItems.push(...activationLockPreflight.reviewItems.map((item) => `runtime_executor_mount.activation_lock_review:${item}`));
    }
    if (!activationLockPreflight.activationLockReady) {
      blockers.push('runtime_executor_mount.activation_lock_not_ready');
    }
    if (activationLockPreflight.target !== 'runtime_dry_run') {
      blockers.push('runtime_executor_mount.activation_lock_target_must_be_runtime_dry_run');
    }
    if (
      activationLockPreflight.runtimeExecutionAllowed !== false
      || activationLockPreflight.runtimeRouteMountAllowed !== false
      || activationLockPreflight.writeExecutionAllowed !== false
      || activationLockPreflight.providerExecutionAllowed !== false
    ) {
      blockers.push('runtime_executor_mount.upstream_execution_must_stay_closed');
    }
  }

  const status: RuntimeDryRunExecutorMountLockPreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'executor_mount_lock_ready';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-runtime-dry-run-executor-mount-lock-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    executorMountReady: status === 'executor_mount_lock_ready',
    runtimeExecutionAllowed: false,
    routeMutationAllowed: false,
    providerCallsAllowed: false,
    writesAllowed: false,
    deployAllowed: false,
    ...(activationLockPreflight ? { activationLockPreflight } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildRuntimeDryRunExecutorMountLockContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function requireRef(value: string | undefined, blocker: string, blockers: string[]): void {
  if (!value) {
    blockers.push(blocker);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function nextStepForStatus(status: RuntimeDryRunExecutorMountLockPreflight['status']): string {
  if (status === 'executor_mount_lock_ready') {
    return 'Runtime dry-run executor mount evidence is ready; a later env-gated route activation may be reviewed separately.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before treating this runtime executor mount lock as ready.';
  }
  return 'Resolve blockers before runtime dry-run executor mount review.';
}
