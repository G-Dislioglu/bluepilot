export type MayaGateProtectedTarget = 'provider_call' | 'write_action' | 'runtime_execution';

export interface MayaGateProbeEvidence {
  reachable?: unknown;
  status?: unknown;
  reason?: unknown;
  recorded?: unknown;
}

export interface MayaCoreGateEnforcementPreflightRequest {
  target?: unknown;
  mayaCoreConfigured?: unknown;
  budget?: MayaGateProbeEvidence;
  corridor?: MayaGateProbeEvidence;
  cost?: MayaGateProbeEvidence;
  operatorApprovalRef?: unknown;
  permitRef?: unknown;
  providerIsolationRef?: unknown;
}

export interface MayaCoreGateSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  deploys: false;
  merges: false;
}

export interface MayaCoreGateEnforcementContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-gate-enforcement-contract-v0.1';
  generatedAt: string;
  sourceProbe: '/health/maya-gate';
  protectedTargets: MayaGateProtectedTarget[];
  requiredEvidence: Record<MayaGateProtectedTarget, string[]>;
  activationBoundary: {
    callsMayaCore: false;
    callsProviders: false;
    executesRuntime: false;
    writesFiles: false;
    writesDatabase: false;
    createsPermits: false;
  };
  failClosedRules: string[];
  sideEffects: MayaCoreGateSideEffects;
}

export interface MayaCoreGateEnforcementPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-gate-enforcement-preflight-v0.1';
  generatedAt: string;
  status: 'ready_for_activation_review' | 'blocked';
  target?: MayaGateProtectedTarget;
  blockers: string[];
  requiredEvidence: string[];
  nextStep: string;
  contract: MayaCoreGateEnforcementContract;
  sideEffects: MayaCoreGateSideEffects;
}

const PROTECTED_TARGETS: MayaGateProtectedTarget[] = ['provider_call', 'write_action', 'runtime_execution'];

const REQUIRED_EVIDENCE: Record<MayaGateProtectedTarget, string[]> = {
  provider_call: ['mayaCoreConfigured', 'budget.reachable', 'cost.recorded', 'providerIsolationRef'],
  write_action: ['mayaCoreConfigured', 'corridor.reachable', 'operatorApprovalRef', 'permitRef'],
  runtime_execution: [
    'mayaCoreConfigured',
    'budget.reachable',
    'corridor.reachable',
    'operatorApprovalRef',
    'providerIsolationRef',
  ],
};

function lockedSideEffects(): MayaCoreGateSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    databaseWrites: false,
    deploys: false,
    merges: false,
  };
}

export function buildMayaCoreGateEnforcementContract(now = new Date()): MayaCoreGateEnforcementContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-gate-enforcement-contract-v0.1',
    generatedAt: now.toISOString(),
    sourceProbe: '/health/maya-gate',
    protectedTargets: PROTECTED_TARGETS,
    requiredEvidence: REQUIRED_EVIDENCE,
    activationBoundary: {
      callsMayaCore: false,
      callsProviders: false,
      executesRuntime: false,
      writesFiles: false,
      writesDatabase: false,
      createsPermits: false,
    },
    failClosedRules: [
      'premium_provider_calls_require_budget_gate_evidence',
      'write_actions_require_corridor_gate_operator_approval_and_permit_evidence',
      'runtime_execution_requires_budget_corridor_operator_and_provider_isolation_evidence',
      'missing_or_unreachable_maya_core_gate_blocks_activation',
    ],
    sideEffects: lockedSideEffects(),
  };
}

export function buildMayaCoreGateEnforcementPreflight(
  request: MayaCoreGateEnforcementPreflightRequest,
  now = new Date(),
): MayaCoreGateEnforcementPreflight {
  const blockers: string[] = [];
  const target = normalizeTarget(request.target, blockers);

  if (target) {
    requireBooleanTrue(request.mayaCoreConfigured, 'maya_gate.maya_core_configured_required', blockers);

    if (target === 'provider_call') {
      requireReachable(request.budget, 'budget', blockers);
      requireRecordedCost(request.cost, blockers);
      requireNonEmptyString(request.providerIsolationRef, 'providerIsolationRef', blockers);
    }

    if (target === 'write_action') {
      requireReachable(request.corridor, 'corridor', blockers);
      requireNonEmptyString(request.operatorApprovalRef, 'operatorApprovalRef', blockers);
      requireNonEmptyString(request.permitRef, 'permitRef', blockers);
    }

    if (target === 'runtime_execution') {
      requireReachable(request.budget, 'budget', blockers);
      requireReachable(request.corridor, 'corridor', blockers);
      requireNonEmptyString(request.operatorApprovalRef, 'operatorApprovalRef', blockers);
      requireNonEmptyString(request.providerIsolationRef, 'providerIsolationRef', blockers);
    }
  }

  const status = blockers.length === 0 ? 'ready_for_activation_review' : 'blocked';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-gate-enforcement-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(target ? { target } : {}),
    blockers,
    requiredEvidence: target ? REQUIRED_EVIDENCE[target] : [],
    nextStep: status === 'ready_for_activation_review'
      ? 'Operator may review this activation evidence; Bluepilot still does not execute the target action here.'
      : 'Collect missing Maya-Core gate evidence before activation review.',
    contract: buildMayaCoreGateEnforcementContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function normalizeTarget(value: unknown, blockers: string[]): MayaGateProtectedTarget | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('maya_gate.target_required');
    return undefined;
  }

  const target = value.trim();
  if (!PROTECTED_TARGETS.includes(target as MayaGateProtectedTarget)) {
    blockers.push(`maya_gate.unsupported_target:${target}`);
    return undefined;
  }

  return target as MayaGateProtectedTarget;
}

function requireBooleanTrue(value: unknown, blocker: string, blockers: string[]): void {
  if (value !== true) {
    blockers.push(blocker);
  }
}

function requireReachable(value: MayaGateProbeEvidence | undefined, gate: 'budget' | 'corridor', blockers: string[]): void {
  if (!value || value.reachable !== true || value.status !== 'reachable') {
    blockers.push(`maya_gate.${gate}_reachable_required`);
  }
}

function requireRecordedCost(value: MayaGateProbeEvidence | undefined, blockers: string[]): void {
  if (!value || value.reachable !== true || value.recorded !== true) {
    blockers.push('maya_gate.cost_recorded_required');
  }
}

function requireNonEmptyString(value: unknown, field: string, blockers: string[]): void {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push(`maya_gate.${field}_required`);
  }
}
