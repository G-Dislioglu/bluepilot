import {
  buildMayaCoreGateEnforcementPreflight,
  type MayaCoreGateEnforcementPreflightRequest,
} from './mayaCoreGateEnforcementContract.js';
import { decideRuntimeExecution } from './runtimeExecutionDecision.js';
import type { RuntimeDryRunAdapterPlan } from './runtimeDryRunAdapterContract.js';

export type ProviderRuntimeActivationTarget = 'provider_call' | 'runtime_dry_run';

export interface ProviderRuntimeActivationPreflightRequest {
  target?: unknown;
  instruction?: unknown;
  requestedBy?: unknown;
  operatorApprovalRef?: unknown;
  providerIsolationRef?: unknown;
  mayaGateEvidenceRef?: unknown;
  maxRuntimeSeconds?: unknown;
  mayaGate?: MayaCoreGateEnforcementPreflightRequest;
}

export interface ProviderRuntimeActivationSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  deploys: false;
  merges: false;
  mayaCoreCalls: false;
}

export interface ProviderRuntimeActivationContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-provider-runtime-activation-preflight-contract-v0.1';
  generatedAt: string;
  gateDependency: '/probe/maya-core-gate-enforcement-preflight';
  protectedTargets: ProviderRuntimeActivationTarget[];
  activationBoundary: {
    callsMayaCore: false;
    callsProviders: false;
    executesRuntime: false;
    allowsRuntimeRoute: false;
    writesDatabase: false;
    writesGitHub: false;
  };
  requiredEvidence: Record<ProviderRuntimeActivationTarget, string[]>;
  sideEffects: ProviderRuntimeActivationSideEffects;
}

export interface ProviderRuntimeActivationPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-provider-runtime-activation-preflight-v0.1';
  generatedAt: string;
  status: 'ready_for_activation_review' | 'review_required' | 'blocked';
  target?: ProviderRuntimeActivationTarget;
  blockers: string[];
  reviewItems: string[];
  providerActivationAllowed: false;
  runtimeActivationAllowed: false;
  dryRunRouteMountAllowed: false;
  mayaGatePreflight?: ReturnType<typeof buildMayaCoreGateEnforcementPreflight>;
  runtimeDecision?: ReturnType<typeof decideRuntimeExecution>;
  nextStep: string;
  contract: ProviderRuntimeActivationContract;
  sideEffects: ProviderRuntimeActivationSideEffects;
}

const TARGETS: ProviderRuntimeActivationTarget[] = ['provider_call', 'runtime_dry_run'];

const REQUIRED_EVIDENCE: Record<ProviderRuntimeActivationTarget, string[]> = {
  provider_call: ['maya_gate_provider_ready', 'providerIsolationRef', 'requestedBy'],
  runtime_dry_run: [
    'maya_gate_runtime_ready',
    'runtime_plan_ready',
    'operatorApprovalRef',
    'providerIsolationRef',
    'maxRuntimeSeconds',
  ],
};

function lockedSideEffects(): ProviderRuntimeActivationSideEffects {
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
  };
}

export function buildProviderRuntimeActivationContract(now = new Date()): ProviderRuntimeActivationContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-provider-runtime-activation-preflight-contract-v0.1',
    generatedAt: now.toISOString(),
    gateDependency: '/probe/maya-core-gate-enforcement-preflight',
    protectedTargets: TARGETS,
    activationBoundary: {
      callsMayaCore: false,
      callsProviders: false,
      executesRuntime: false,
      allowsRuntimeRoute: false,
      writesDatabase: false,
      writesGitHub: false,
    },
    requiredEvidence: REQUIRED_EVIDENCE,
    sideEffects: lockedSideEffects(),
  };
}

export function buildProviderRuntimeActivationPreflight(
  request: ProviderRuntimeActivationPreflightRequest,
  now = new Date(),
): ProviderRuntimeActivationPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const target = normalizeTarget(request.target, blockers);
  const requestedBy = normalizeString(request.requestedBy);
  const providerIsolationRef = normalizeString(request.providerIsolationRef);
  const operatorApprovalRef = normalizeString(request.operatorApprovalRef);
  const mayaGateEvidenceRef = normalizeString(request.mayaGateEvidenceRef);
  const instruction = normalizeString(request.instruction);
  const maxRuntimeSeconds = normalizeRuntimeSeconds(request.maxRuntimeSeconds, blockers);
  let mayaGatePreflight: ReturnType<typeof buildMayaCoreGateEnforcementPreflight> | undefined;
  let runtimeDecision: ReturnType<typeof decideRuntimeExecution> | undefined;

  if (target === 'provider_call') {
    mayaGatePreflight = buildMayaCoreGateEnforcementPreflight({
      ...(request.mayaGate ?? {}),
      target: 'provider_call',
      providerIsolationRef: providerIsolationRef ?? request.mayaGate?.providerIsolationRef,
    }, now);

    if (mayaGatePreflight.status !== 'ready_for_activation_review') {
      blockers.push(...mayaGatePreflight.blockers.map((blocker) => `provider_runtime.provider_gate_blocked:${blocker}`));
    }
    if (!providerIsolationRef) {
      blockers.push('provider_runtime.provider_isolation_ref_required');
    }
    if (!requestedBy) {
      reviewItems.push('provider_runtime.requested_by_recommended');
    }
  }

  if (target === 'runtime_dry_run') {
    mayaGatePreflight = buildMayaCoreGateEnforcementPreflight({
      ...(request.mayaGate ?? {}),
      target: 'runtime_execution',
      operatorApprovalRef: operatorApprovalRef ?? request.mayaGate?.operatorApprovalRef,
      providerIsolationRef: providerIsolationRef ?? request.mayaGate?.providerIsolationRef,
    }, now);

    const plan = buildRuntimePlan(instruction, requestedBy);
    runtimeDecision = decideRuntimeExecution({
      mode: 'dry_run_execution',
      plan,
      operatorApprovalRef,
      mayaGateEvidenceRef: mayaGateEvidenceRef ?? (mayaGatePreflight.status === 'ready_for_activation_review'
        ? 'maya-gate:preflight-ready'
        : undefined),
      providerIsolationRef,
      maxRuntimeSeconds,
    });

    if (mayaGatePreflight.status !== 'ready_for_activation_review') {
      blockers.push(...mayaGatePreflight.blockers.map((blocker) => `provider_runtime.runtime_gate_blocked:${blocker}`));
    }
    if (runtimeDecision.status === 'blocked') {
      blockers.push(...runtimeDecision.blockers.map((blocker) => `provider_runtime.runtime_decision_blocked:${blocker}`));
    }
    if (runtimeDecision.status === 'review_required') {
      reviewItems.push(...runtimeDecision.reviewItems.map((item) => `provider_runtime.runtime_decision_review:${item}`));
    }
    if (!instruction) {
      blockers.push('provider_runtime.runtime_instruction_required');
    }
  }

  const status = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready_for_activation_review';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-provider-runtime-activation-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(target ? { target } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    providerActivationAllowed: false,
    runtimeActivationAllowed: false,
    dryRunRouteMountAllowed: false,
    ...(mayaGatePreflight ? { mayaGatePreflight } : {}),
    ...(runtimeDecision ? { runtimeDecision } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildProviderRuntimeActivationContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function buildRuntimePlan(instruction: string | undefined, requestedBy: string | undefined): RuntimeDryRunAdapterPlan {
  const blockers = instruction ? [] : ['runtime_dry_run.instruction_required'];

  return {
    status: blockers.length ? 'blocked' : 'ready',
    dryRunInvocationAllowed: blockers.length === 0,
    runtimeDispatchAllowed: false,
    contractTaskId: 'provider-runtime-activation-preflight',
    instruction: instruction ?? '',
    ...(requestedBy ? { requestedBy } : {}),
    blockers,
    reviewItems: [],
    invocation: {
      dryRun: true,
      skipDeploy: true,
      allowProviderCalls: false,
      allowDatabaseWrites: false,
      allowGitHubWrites: false,
      allowRuntimeRoute: false,
    },
    nextActions: blockers.length
      ? ['provide_runtime_instruction_before_activation_review']
      : ['operator_may_review_runtime_activation_without_execution'],
  };
}

function normalizeTarget(value: unknown, blockers: string[]): ProviderRuntimeActivationTarget | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('provider_runtime.target_required');
    return undefined;
  }

  const target = value.trim();
  if (!TARGETS.includes(target as ProviderRuntimeActivationTarget)) {
    blockers.push(`provider_runtime.unsupported_target:${target}`);
    return undefined;
  }

  return target as ProviderRuntimeActivationTarget;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeRuntimeSeconds(value: unknown, blockers: string[]): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    blockers.push('provider_runtime.max_runtime_seconds_must_be_finite');
    return undefined;
  }

  return Math.trunc(numeric);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function nextStepForStatus(status: ProviderRuntimeActivationPreflight['status']): string {
  if (status === 'ready_for_activation_review') {
    return 'Operator may review activation evidence; Bluepilot still does not call providers or execute runtime here.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before any later activation lock.';
  }
  return 'Resolve blockers before provider or runtime activation review.';
}
