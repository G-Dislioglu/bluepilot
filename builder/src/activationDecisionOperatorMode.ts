export type OperatorAutonomyMode = 'read_only' | 'review_only' | 'supervised_execution' | 'full_access';
export type ActivationDecisionTarget = 'provider_call' | 'runtime_dry_run' | 'write_action' | 'durable_receipt_store';
export type ActivationDecisionStatus = 'execute_allowed' | 'review_required' | 'blocked';

export interface ActivationDecisionEvidence {
  status?: unknown;
  executorMountReady?: unknown;
  storeReady?: unknown;
  ref?: unknown;
}

export interface ActivationDecisionOperatorModeRequest {
  autonomyMode?: unknown;
  target?: unknown;
  operatorGrantRef?: unknown;
  operatorGrantScope?: unknown;
  perActionApprovalRef?: unknown;
  activationDecisionRef?: unknown;
  ethicsCharterRef?: unknown;
  safetyEvidenceRef?: unknown;
  userIntentRef?: unknown;
  bankingOrFinancialAction?: unknown;
  externalIrreversibleAction?: unknown;
  prohibitedActionCategories?: unknown;
  executorEvidence?: ActivationDecisionEvidence;
  durableReceiptStore?: ActivationDecisionEvidence;
}

export interface ActivationDecisionOperatorModeSideEffects {
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

export interface ActivationDecisionOperatorModeContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-activation-decision-operator-mode-contract-v0.1';
  generatedAt: string;
  autonomyModes: OperatorAutonomyMode[];
  protectedTargets: ActivationDecisionTarget[];
  hardStopCategories: string[];
  requiredEvidence: Record<OperatorAutonomyMode, string[]>;
  decisionBoundary: {
    evaluatesOnly: true;
    callsProviders: false;
    executesRuntime: false;
    writesFiles: false;
    writesDatabase: false;
    writesGitHub: false;
    persistsReceipts: false;
    issuesPermits: false;
  };
  sideEffects: ActivationDecisionOperatorModeSideEffects;
}

export interface ActivationDecisionOperatorModePreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-activation-decision-operator-mode-preflight-v0.1';
  generatedAt: string;
  status: ActivationDecisionStatus;
  autonomyMode?: OperatorAutonomyMode;
  target?: ActivationDecisionTarget;
  blockers: string[];
  reviewItems: string[];
  executeAllowed: boolean;
  repeatedPromptRequired: boolean;
  operatorGrantCarriesForward: boolean;
  allowedActions: {
    providerCall: boolean;
    runtimeDryRun: boolean;
    writeAction: boolean;
    durableReceiptPersistence: boolean;
  };
  nextStep: string;
  contract: ActivationDecisionOperatorModeContract;
  sideEffects: ActivationDecisionOperatorModeSideEffects;
}

const AUTONOMY_MODES: OperatorAutonomyMode[] = ['read_only', 'review_only', 'supervised_execution', 'full_access'];
const TARGETS: ActivationDecisionTarget[] = ['provider_call', 'runtime_dry_run', 'write_action', 'durable_receipt_store'];

const HARD_STOP_CATEGORIES = [
  'banking',
  'financial_transaction',
  'illegal_action',
  'ethics_charter_violation',
  'malware_or_abuse',
  'privacy_invasion',
  'deception_or_impersonation',
  'weapons',
  'self_harm',
  'medical_or_legal_high_stakes_submission',
];

const REQUIRED_EVIDENCE: Record<OperatorAutonomyMode, string[]> = {
  read_only: ['target', 'userIntentRef'],
  review_only: ['target', 'userIntentRef', 'activationDecisionRef'],
  supervised_execution: [
    'target',
    'operatorGrantRef',
    'perActionApprovalRef',
    'activationDecisionRef',
    'ethicsCharterRef',
    'safetyEvidenceRef',
    'executor_or_store_ready',
    'durableReceiptStore.store_ready_for_activation_review',
  ],
  full_access: [
    'target',
    'operatorGrantRef',
    'operatorGrantScope.full_access',
    'activationDecisionRef',
    'ethicsCharterRef',
    'safetyEvidenceRef',
    'executor_or_store_ready',
    'durableReceiptStore.store_ready_for_activation_review',
  ],
};

function lockedSideEffects(): ActivationDecisionOperatorModeSideEffects {
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

export function buildActivationDecisionOperatorModeContract(
  now = new Date(),
): ActivationDecisionOperatorModeContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-activation-decision-operator-mode-contract-v0.1',
    generatedAt: now.toISOString(),
    autonomyModes: AUTONOMY_MODES,
    protectedTargets: TARGETS,
    hardStopCategories: HARD_STOP_CATEGORIES,
    requiredEvidence: REQUIRED_EVIDENCE,
    decisionBoundary: {
      evaluatesOnly: true,
      callsProviders: false,
      executesRuntime: false,
      writesFiles: false,
      writesDatabase: false,
      writesGitHub: false,
      persistsReceipts: false,
      issuesPermits: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildActivationDecisionOperatorModePreflight(
  request: ActivationDecisionOperatorModeRequest,
  now = new Date(),
): ActivationDecisionOperatorModePreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const autonomyMode = normalizeAutonomyMode(request.autonomyMode, blockers);
  const target = normalizeTarget(request.target, blockers);
  const operatorGrantRef = normalizeString(request.operatorGrantRef);
  const operatorGrantScope = normalizeString(request.operatorGrantScope);
  const perActionApprovalRef = normalizeString(request.perActionApprovalRef);
  const activationDecisionRef = normalizeString(request.activationDecisionRef);
  const ethicsCharterRef = normalizeString(request.ethicsCharterRef);
  const safetyEvidenceRef = normalizeString(request.safetyEvidenceRef);
  const userIntentRef = normalizeString(request.userIntentRef);

  requireRef(userIntentRef, 'activation_decision.user_intent_ref_required', blockers);

  if (request.bankingOrFinancialAction === true) {
    blockers.push('activation_decision.hard_stop:banking_or_financial_action');
  }
  if (request.externalIrreversibleAction === true && autonomyMode !== 'full_access') {
    blockers.push('activation_decision.external_irreversible_action_requires_full_access');
  }

  const prohibitedCategories = normalizeStringArray(request.prohibitedActionCategories);
  for (const category of prohibitedCategories) {
    if (HARD_STOP_CATEGORIES.includes(category)) {
      blockers.push(`activation_decision.hard_stop:${category}`);
    } else {
      reviewItems.push(`activation_decision.unrecognized_risk_category:${category}`);
    }
  }

  if (autonomyMode === 'read_only') {
    reviewItems.push('activation_decision.read_only_mode_never_executes');
  }

  if (autonomyMode === 'review_only') {
    requireRef(activationDecisionRef, 'activation_decision.activation_decision_ref_required', blockers);
    reviewItems.push('activation_decision.review_only_mode_never_executes');
  }

  if (autonomyMode === 'supervised_execution' || autonomyMode === 'full_access') {
    requireRef(operatorGrantRef, 'activation_decision.operator_grant_ref_required', blockers);
    requireRef(activationDecisionRef, 'activation_decision.activation_decision_ref_required', blockers);
    requireRef(ethicsCharterRef, 'activation_decision.ethics_charta_ref_required', blockers);
    requireRef(safetyEvidenceRef, 'activation_decision.safety_evidence_ref_required', blockers);
    requireReadyExecutionEvidence(target, request, blockers);
    requireReadyReceiptStore(request.durableReceiptStore, blockers);
  }

  if (autonomyMode === 'supervised_execution') {
    requireRef(perActionApprovalRef, 'activation_decision.per_action_approval_ref_required', blockers);
  }

  if (autonomyMode === 'full_access' && operatorGrantScope !== 'full_access') {
    blockers.push('activation_decision.full_access_scope_required');
  }

  const canExecuteMode = autonomyMode === 'supervised_execution' || autonomyMode === 'full_access';
  const status: ActivationDecisionStatus = blockers.length > 0
    ? 'blocked'
    : canExecuteMode && reviewItems.length === 0
      ? 'execute_allowed'
      : 'review_required';
  const executeAllowed = status === 'execute_allowed';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-activation-decision-operator-mode-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(autonomyMode ? { autonomyMode } : {}),
    ...(target ? { target } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    executeAllowed,
    repeatedPromptRequired: autonomyMode !== 'full_access',
    operatorGrantCarriesForward: autonomyMode === 'full_access' && executeAllowed,
    allowedActions: {
      providerCall: executeAllowed && target === 'provider_call',
      runtimeDryRun: executeAllowed && target === 'runtime_dry_run',
      writeAction: executeAllowed && target === 'write_action',
      durableReceiptPersistence: executeAllowed && target === 'durable_receipt_store',
    },
    nextStep: nextStepForStatus(status, autonomyMode),
    contract: buildActivationDecisionOperatorModeContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function requireReadyExecutionEvidence(
  target: ActivationDecisionTarget | undefined,
  request: ActivationDecisionOperatorModeRequest,
  blockers: string[],
): void {
  if (!target) {
    return;
  }
  if (target === 'durable_receipt_store') {
    return;
  }
  const evidence = request.executorEvidence;
  if (!evidence) {
    blockers.push('activation_decision.executor_evidence_required');
    return;
  }
  if (normalizeString(evidence.status) !== 'executor_mount_lock_ready' || evidence.executorMountReady !== true) {
    blockers.push('activation_decision.executor_mount_not_ready');
  }
}

function requireReadyReceiptStore(
  evidence: ActivationDecisionEvidence | undefined,
  blockers: string[],
): void {
  if (!evidence) {
    blockers.push('activation_decision.durable_receipt_store_required');
    return;
  }
  if (normalizeString(evidence.status) !== 'store_ready_for_activation_review' || evidence.storeReady !== true) {
    blockers.push('activation_decision.durable_receipt_store_not_ready');
  }
}

function normalizeAutonomyMode(value: unknown, blockers: string[]): OperatorAutonomyMode | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('activation_decision.autonomy_mode_required');
    return undefined;
  }
  const normalized = value.trim();
  if (!AUTONOMY_MODES.includes(normalized as OperatorAutonomyMode)) {
    blockers.push(`activation_decision.unsupported_autonomy_mode:${normalized}`);
    return undefined;
  }
  return normalized as OperatorAutonomyMode;
}

function normalizeTarget(value: unknown, blockers: string[]): ActivationDecisionTarget | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('activation_decision.target_required');
    return undefined;
  }
  const normalized = value.trim();
  if (!TARGETS.includes(normalized as ActivationDecisionTarget)) {
    blockers.push(`activation_decision.unsupported_target:${normalized}`);
    return undefined;
  }
  return normalized as ActivationDecisionTarget;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const normalized = normalizeString(entry);
    return normalized ? [normalized] : [];
  });
}

function requireRef(value: string | undefined, blocker: string, blockers: string[]): void {
  if (!value) {
    blockers.push(blocker);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function nextStepForStatus(
  status: ActivationDecisionStatus,
  autonomyMode: OperatorAutonomyMode | undefined,
): string {
  if (status === 'execute_allowed' && autonomyMode === 'full_access') {
    return 'Full-access grant is sufficient for this target; proceed to the target executor activation without repeated operator prompts.';
  }
  if (status === 'execute_allowed') {
    return 'Per-action supervised approval is sufficient for this target; proceed to the target executor activation.';
  }
  if (status === 'review_required') {
    return 'Action remains review-only until execution-mode evidence is complete.';
  }
  return 'Resolve hard blockers before any execution decision can be allowed.';
}
