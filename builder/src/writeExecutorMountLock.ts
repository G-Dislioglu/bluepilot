import {
  buildActivationLockPreflight,
  type ActivationLockRequest,
} from './activationLockBoundary.js';

export interface WriteExecutorMountLockRequest {
  confirm?: unknown;
  operatorExecutionRef?: unknown;
  writeMountRef?: unknown;
  permitRef?: unknown;
  targetRepoRef?: unknown;
  targetPathRef?: unknown;
  contentHashRef?: unknown;
  activationLock?: ActivationLockRequest;
}

export interface WriteExecutorMountLockSideEffects {
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

export interface WriteExecutorMountLockContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-write-executor-mount-lock-contract-v0.1';
  generatedAt: string;
  upstreamLock: '/probe/activation-lock-preflight';
  protectedTarget: 'write_action';
  requiredEvidence: string[];
  mountBoundary: {
    writesAllowed: false;
    providerCallsAllowed: false;
    runtimeExecutionAllowed: false;
    routeMutationAllowed: false;
    deployAllowed: false;
  };
  sideEffects: WriteExecutorMountLockSideEffects;
}

export interface WriteExecutorMountLockPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-write-executor-mount-lock-preflight-v0.1';
  generatedAt: string;
  status: 'executor_mount_lock_ready' | 'review_required' | 'blocked';
  blockers: string[];
  reviewItems: string[];
  executorMountReady: boolean;
  writesAllowed: false;
  providerCallsAllowed: false;
  runtimeExecutionAllowed: false;
  routeMutationAllowed: false;
  deployAllowed: false;
  activationLockPreflight?: ReturnType<typeof buildActivationLockPreflight>;
  nextStep: string;
  contract: WriteExecutorMountLockContract;
  sideEffects: WriteExecutorMountLockSideEffects;
}

export const WRITE_EXECUTOR_MOUNT_CONFIRM = 'mount-write-executor-review-only';

const REQUIRED_EVIDENCE = [
  'confirm',
  'operatorExecutionRef',
  'writeMountRef',
  'permitRef',
  'targetRepoRef',
  'targetPathRef',
  'contentHashRef',
  'activationLock.activation_lock_ready',
  'activationLock.target.write_action',
];

function lockedSideEffects(): WriteExecutorMountLockSideEffects {
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

export function buildWriteExecutorMountLockContract(now = new Date()): WriteExecutorMountLockContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-write-executor-mount-lock-contract-v0.1',
    generatedAt: now.toISOString(),
    upstreamLock: '/probe/activation-lock-preflight',
    protectedTarget: 'write_action',
    requiredEvidence: REQUIRED_EVIDENCE,
    mountBoundary: {
      writesAllowed: false,
      providerCallsAllowed: false,
      runtimeExecutionAllowed: false,
      routeMutationAllowed: false,
      deployAllowed: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildWriteExecutorMountLockPreflight(
  request: WriteExecutorMountLockRequest,
  now = new Date(),
): WriteExecutorMountLockPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const confirm = normalizeString(request.confirm);
  const operatorExecutionRef = normalizeString(request.operatorExecutionRef);
  const writeMountRef = normalizeString(request.writeMountRef);
  const permitRef = normalizeString(request.permitRef);
  const targetRepoRef = normalizeString(request.targetRepoRef);
  const targetPathRef = normalizeString(request.targetPathRef);
  const contentHashRef = normalizeString(request.contentHashRef);
  let activationLockPreflight: ReturnType<typeof buildActivationLockPreflight> | undefined;

  if (confirm !== WRITE_EXECUTOR_MOUNT_CONFIRM) {
    blockers.push('write_executor_mount.confirm_required');
  }
  requireRef(operatorExecutionRef, 'write_executor_mount.operator_execution_ref_required', blockers);
  requireRef(writeMountRef, 'write_executor_mount.write_mount_ref_required', blockers);
  requireRef(permitRef, 'write_executor_mount.permit_ref_required', blockers);
  requireRef(targetRepoRef, 'write_executor_mount.target_repo_ref_required', blockers);
  requireRef(targetPathRef, 'write_executor_mount.target_path_ref_required', blockers);
  requireRef(contentHashRef, 'write_executor_mount.content_hash_ref_required', blockers);

  if (!request.activationLock) {
    blockers.push('write_executor_mount.activation_lock_required');
  } else {
    activationLockPreflight = buildActivationLockPreflight({
      ...request.activationLock,
      target: 'write_action',
    }, now);

    if (activationLockPreflight.status === 'blocked') {
      blockers.push(...activationLockPreflight.blockers.map((blocker) => `write_executor_mount.activation_lock_blocked:${blocker}`));
    }
    if (activationLockPreflight.status === 'review_required') {
      reviewItems.push(...activationLockPreflight.reviewItems.map((item) => `write_executor_mount.activation_lock_review:${item}`));
    }
    if (!activationLockPreflight.activationLockReady) {
      blockers.push('write_executor_mount.activation_lock_not_ready');
    }
    if (activationLockPreflight.target !== 'write_action') {
      blockers.push('write_executor_mount.activation_lock_target_must_be_write_action');
    }
    if (
      activationLockPreflight.writeExecutionAllowed !== false
      || activationLockPreflight.providerExecutionAllowed !== false
      || activationLockPreflight.runtimeExecutionAllowed !== false
      || activationLockPreflight.runtimeRouteMountAllowed !== false
      || activationLockPreflight.permitIssueAllowed !== false
    ) {
      blockers.push('write_executor_mount.upstream_execution_must_stay_closed');
    }
  }

  const status: WriteExecutorMountLockPreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'executor_mount_lock_ready';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-write-executor-mount-lock-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    executorMountReady: status === 'executor_mount_lock_ready',
    writesAllowed: false,
    providerCallsAllowed: false,
    runtimeExecutionAllowed: false,
    routeMutationAllowed: false,
    deployAllowed: false,
    ...(activationLockPreflight ? { activationLockPreflight } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildWriteExecutorMountLockContract(now),
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

function nextStepForStatus(status: WriteExecutorMountLockPreflight['status']): string {
  if (status === 'executor_mount_lock_ready') {
    return 'Write executor mount evidence is ready; a later write execution activation may be reviewed separately.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before treating this write executor mount lock as ready.';
  }
  return 'Resolve blockers before write executor mount review.';
}
