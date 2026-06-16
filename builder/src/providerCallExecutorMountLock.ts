import {
  buildActivationLockPreflight,
  type ActivationLockRequest,
} from './activationLockBoundary.js';

export interface ProviderCallExecutorMountLockRequest {
  confirm?: unknown;
  operatorExecutionRef?: unknown;
  providerMountRef?: unknown;
  providerIsolationRef?: unknown;
  activationLock?: ActivationLockRequest;
}

export interface ProviderCallExecutorMountLockSideEffects {
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

export interface ProviderCallExecutorMountLockContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-provider-call-executor-mount-lock-contract-v0.1';
  generatedAt: string;
  upstreamLock: '/probe/activation-lock-preflight';
  protectedTarget: 'provider_call';
  requiredEvidence: string[];
  mountBoundary: {
    providerCallsAllowed: false;
    runtimeExecutionAllowed: false;
    routeMutationAllowed: false;
    writesAllowed: false;
    deployAllowed: false;
  };
  sideEffects: ProviderCallExecutorMountLockSideEffects;
}

export interface ProviderCallExecutorMountLockPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-provider-call-executor-mount-lock-preflight-v0.1';
  generatedAt: string;
  status: 'executor_mount_lock_ready' | 'review_required' | 'blocked';
  blockers: string[];
  reviewItems: string[];
  executorMountReady: boolean;
  providerCallsAllowed: false;
  runtimeExecutionAllowed: false;
  routeMutationAllowed: false;
  writesAllowed: false;
  deployAllowed: false;
  activationLockPreflight?: ReturnType<typeof buildActivationLockPreflight>;
  nextStep: string;
  contract: ProviderCallExecutorMountLockContract;
  sideEffects: ProviderCallExecutorMountLockSideEffects;
}

export const PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM = 'mount-provider-call-executor-review-only';

const REQUIRED_EVIDENCE = [
  'confirm',
  'operatorExecutionRef',
  'providerMountRef',
  'providerIsolationRef',
  'activationLock.activation_lock_ready',
  'activationLock.target.provider_call',
];

function lockedSideEffects(): ProviderCallExecutorMountLockSideEffects {
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

export function buildProviderCallExecutorMountLockContract(
  now = new Date(),
): ProviderCallExecutorMountLockContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-provider-call-executor-mount-lock-contract-v0.1',
    generatedAt: now.toISOString(),
    upstreamLock: '/probe/activation-lock-preflight',
    protectedTarget: 'provider_call',
    requiredEvidence: REQUIRED_EVIDENCE,
    mountBoundary: {
      providerCallsAllowed: false,
      runtimeExecutionAllowed: false,
      routeMutationAllowed: false,
      writesAllowed: false,
      deployAllowed: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildProviderCallExecutorMountLockPreflight(
  request: ProviderCallExecutorMountLockRequest,
  now = new Date(),
): ProviderCallExecutorMountLockPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const confirm = normalizeString(request.confirm);
  const operatorExecutionRef = normalizeString(request.operatorExecutionRef);
  const providerMountRef = normalizeString(request.providerMountRef);
  const providerIsolationRef = normalizeString(request.providerIsolationRef);
  let activationLockPreflight: ReturnType<typeof buildActivationLockPreflight> | undefined;

  if (confirm !== PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM) {
    blockers.push('provider_executor_mount.confirm_required');
  }
  requireRef(operatorExecutionRef, 'provider_executor_mount.operator_execution_ref_required', blockers);
  requireRef(providerMountRef, 'provider_executor_mount.provider_mount_ref_required', blockers);
  requireRef(providerIsolationRef, 'provider_executor_mount.provider_isolation_ref_required', blockers);

  if (!request.activationLock) {
    blockers.push('provider_executor_mount.activation_lock_required');
  } else {
    activationLockPreflight = buildActivationLockPreflight({
      ...request.activationLock,
      target: 'provider_call',
    }, now);

    if (activationLockPreflight.status === 'blocked') {
      blockers.push(...activationLockPreflight.blockers.map((blocker) => `provider_executor_mount.activation_lock_blocked:${blocker}`));
    }
    if (activationLockPreflight.status === 'review_required') {
      reviewItems.push(...activationLockPreflight.reviewItems.map((item) => `provider_executor_mount.activation_lock_review:${item}`));
    }
    if (!activationLockPreflight.activationLockReady) {
      blockers.push('provider_executor_mount.activation_lock_not_ready');
    }
    if (activationLockPreflight.target !== 'provider_call') {
      blockers.push('provider_executor_mount.activation_lock_target_must_be_provider_call');
    }
    if (
      activationLockPreflight.providerExecutionAllowed !== false
      || activationLockPreflight.runtimeExecutionAllowed !== false
      || activationLockPreflight.runtimeRouteMountAllowed !== false
      || activationLockPreflight.writeExecutionAllowed !== false
    ) {
      blockers.push('provider_executor_mount.upstream_execution_must_stay_closed');
    }
  }

  const status: ProviderCallExecutorMountLockPreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'executor_mount_lock_ready';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-provider-call-executor-mount-lock-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    executorMountReady: status === 'executor_mount_lock_ready',
    providerCallsAllowed: false,
    runtimeExecutionAllowed: false,
    routeMutationAllowed: false,
    writesAllowed: false,
    deployAllowed: false,
    ...(activationLockPreflight ? { activationLockPreflight } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildProviderCallExecutorMountLockContract(now),
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

function nextStepForStatus(status: ProviderCallExecutorMountLockPreflight['status']): string {
  if (status === 'executor_mount_lock_ready') {
    return 'Provider-call executor mount evidence is ready; a later provider execution activation may be reviewed separately.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before treating this provider executor mount lock as ready.';
  }
  return 'Resolve blockers before provider-call executor mount review.';
}
