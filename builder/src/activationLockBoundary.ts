import {
  buildMayaCoreGateEnforcementPreflight,
  type MayaCoreGateEnforcementPreflightRequest,
} from './mayaCoreGateEnforcementContract.js';
import {
  buildProviderRuntimeActivationPreflight,
  type ProviderRuntimeActivationPreflightRequest,
} from './providerRuntimeActivationPreflight.js';

export type ActivationLockTarget = 'provider_call' | 'runtime_dry_run' | 'write_action';

export interface ActivationLockRequest {
  target?: unknown;
  activationIntentRef?: unknown;
  operatorDecisionRef?: unknown;
  liveEvidenceRef?: unknown;
  providerRuntime?: ProviderRuntimeActivationPreflightRequest;
  mayaGate?: MayaCoreGateEnforcementPreflightRequest;
  targetRepoRef?: unknown;
  targetPathRef?: unknown;
  contentHashRef?: unknown;
}

export interface ActivationLockSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  deploys: false;
  merges: false;
  mayaCoreCalls: false;
  permitsIssued: false;
}

export interface ActivationLockContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-activation-lock-boundary-contract-v0.1';
  generatedAt: string;
  upstreamPreflights: {
    mayaCoreGate: '/probe/maya-core-gate-enforcement-preflight';
    providerRuntime: '/probe/provider-runtime-activation-preflight';
  };
  protectedTargets: ActivationLockTarget[];
  requiredEvidence: Record<ActivationLockTarget, string[]>;
  activationBoundary: {
    callsProviders: false;
    executesRuntime: false;
    mountsRuntimeRoute: false;
    writesFiles: false;
    writesDatabase: false;
    writesGitHub: false;
    issuesPermits: false;
  };
  sideEffects: ActivationLockSideEffects;
}

export interface ActivationLockPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-activation-lock-boundary-preflight-v0.1';
  generatedAt: string;
  status: 'activation_lock_ready' | 'review_required' | 'blocked';
  target?: ActivationLockTarget;
  blockers: string[];
  reviewItems: string[];
  activationLockReady: boolean;
  providerExecutionAllowed: false;
  runtimeExecutionAllowed: false;
  writeExecutionAllowed: false;
  runtimeRouteMountAllowed: false;
  permitIssueAllowed: false;
  providerRuntimePreflight?: ReturnType<typeof buildProviderRuntimeActivationPreflight>;
  mayaGatePreflight?: ReturnType<typeof buildMayaCoreGateEnforcementPreflight>;
  nextStep: string;
  contract: ActivationLockContract;
  sideEffects: ActivationLockSideEffects;
}

const TARGETS: ActivationLockTarget[] = ['provider_call', 'runtime_dry_run', 'write_action'];

const REQUIRED_EVIDENCE: Record<ActivationLockTarget, string[]> = {
  provider_call: [
    'activationIntentRef',
    'operatorDecisionRef',
    'liveEvidenceRef',
    'providerRuntimePreflight.ready_for_activation_review',
    'providerIsolationRef',
  ],
  runtime_dry_run: [
    'activationIntentRef',
    'operatorDecisionRef',
    'liveEvidenceRef',
    'providerRuntimePreflight.ready_for_activation_review',
    'runtimeDecision.ready',
    'operatorApprovalRef',
    'providerIsolationRef',
    'maxRuntimeSeconds',
  ],
  write_action: [
    'activationIntentRef',
    'operatorDecisionRef',
    'liveEvidenceRef',
    'mayaGatePreflight.ready_for_activation_review',
    'operatorApprovalRef',
    'permitRef',
    'targetRepoRef',
    'targetPathRef',
    'contentHashRef',
  ],
};

function lockedSideEffects(): ActivationLockSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    databaseWrites: false,
    deploys: false,
    merges: false,
    mayaCoreCalls: false,
    permitsIssued: false,
  };
}

export function buildActivationLockContract(now = new Date()): ActivationLockContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-activation-lock-boundary-contract-v0.1',
    generatedAt: now.toISOString(),
    upstreamPreflights: {
      mayaCoreGate: '/probe/maya-core-gate-enforcement-preflight',
      providerRuntime: '/probe/provider-runtime-activation-preflight',
    },
    protectedTargets: TARGETS,
    requiredEvidence: REQUIRED_EVIDENCE,
    activationBoundary: {
      callsProviders: false,
      executesRuntime: false,
      mountsRuntimeRoute: false,
      writesFiles: false,
      writesDatabase: false,
      writesGitHub: false,
      issuesPermits: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildActivationLockPreflight(
  request: ActivationLockRequest,
  now = new Date(),
): ActivationLockPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const target = normalizeTarget(request.target, blockers);
  const activationIntentRef = normalizeString(request.activationIntentRef);
  const operatorDecisionRef = normalizeString(request.operatorDecisionRef);
  const liveEvidenceRef = normalizeString(request.liveEvidenceRef);
  let providerRuntimePreflight: ReturnType<typeof buildProviderRuntimeActivationPreflight> | undefined;
  let mayaGatePreflight: ReturnType<typeof buildMayaCoreGateEnforcementPreflight> | undefined;

  requireRef(activationIntentRef, 'activation_lock.activation_intent_ref_required', blockers);
  requireRef(operatorDecisionRef, 'activation_lock.operator_decision_ref_required', blockers);
  requireRef(liveEvidenceRef, 'activation_lock.live_evidence_ref_required', blockers);

  if (target === 'provider_call' || target === 'runtime_dry_run') {
    providerRuntimePreflight = buildProviderRuntimeActivationPreflight({
      ...(request.providerRuntime ?? {}),
      target,
    }, now);

    if (providerRuntimePreflight.status === 'blocked') {
      blockers.push(...providerRuntimePreflight.blockers.map((blocker) => `activation_lock.provider_runtime_blocked:${blocker}`));
    }
    if (providerRuntimePreflight.status === 'review_required') {
      reviewItems.push(...providerRuntimePreflight.reviewItems.map((item) => `activation_lock.provider_runtime_review:${item}`));
    }
    if (providerRuntimePreflight.status !== 'ready_for_activation_review') {
      blockers.push('activation_lock.provider_runtime_preflight_not_ready');
    }
    if (
      providerRuntimePreflight.providerActivationAllowed !== false
      || providerRuntimePreflight.runtimeActivationAllowed !== false
      || providerRuntimePreflight.dryRunRouteMountAllowed !== false
    ) {
      blockers.push('activation_lock.upstream_activation_must_stay_closed');
    }
    if (target === 'runtime_dry_run' && providerRuntimePreflight.runtimeDecision?.status !== 'ready') {
      blockers.push('activation_lock.runtime_decision_not_ready');
    }
  }

  if (target === 'write_action') {
    mayaGatePreflight = buildMayaCoreGateEnforcementPreflight({
      ...(request.mayaGate ?? {}),
      target: 'write_action',
    }, now);

    if (mayaGatePreflight.status !== 'ready_for_activation_review') {
      blockers.push(...mayaGatePreflight.blockers.map((blocker) => `activation_lock.write_gate_blocked:${blocker}`));
      blockers.push('activation_lock.write_gate_preflight_not_ready');
    }
    requireRef(normalizeString(request.targetRepoRef), 'activation_lock.target_repo_ref_required', blockers);
    requireRef(normalizeString(request.targetPathRef), 'activation_lock.target_path_ref_required', blockers);
    requireRef(normalizeString(request.contentHashRef), 'activation_lock.content_hash_ref_required', blockers);
  }

  const status: ActivationLockPreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'activation_lock_ready';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-activation-lock-boundary-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(target ? { target } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    activationLockReady: status === 'activation_lock_ready',
    providerExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    writeExecutionAllowed: false,
    runtimeRouteMountAllowed: false,
    permitIssueAllowed: false,
    ...(providerRuntimePreflight ? { providerRuntimePreflight } : {}),
    ...(mayaGatePreflight ? { mayaGatePreflight } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildActivationLockContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function normalizeTarget(value: unknown, blockers: string[]): ActivationLockTarget | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('activation_lock.target_required');
    return undefined;
  }

  const target = value.trim();
  if (!TARGETS.includes(target as ActivationLockTarget)) {
    blockers.push(`activation_lock.unsupported_target:${target}`);
    return undefined;
  }

  return target as ActivationLockTarget;
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

function nextStepForStatus(status: ActivationLockPreflight['status']): string {
  if (status === 'activation_lock_ready') {
    return 'Activation evidence is lock-ready; open a separate executor-mount task before any real provider, runtime, or write action.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before this activation lock can be treated as ready.';
  }
  return 'Resolve blockers before opening any provider, runtime, or write executor lock.';
}
