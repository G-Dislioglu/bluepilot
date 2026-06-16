export type MayaAutonomyMode = 'read_only' | 'review_only' | 'supervised_execution' | 'full_access';
export type MayaAutonomyTarget = 'provider_call' | 'runtime_dry_run' | 'write_action' | 'durable_receipt_store';
export type MayaAutonomyIntakeStatus = 'ready_for_activation_review' | 'blocked';

export interface MayaAutonomyAuthorityDecisionEvidence {
  status?: unknown;
  authorityRef?: unknown;
  decisionRef?: unknown;
  subjectRef?: unknown;
  autonomyMode?: unknown;
  grantScope?: unknown;
  ethicsCharterRef?: unknown;
  safetyEvidenceRef?: unknown;
  issuedAt?: unknown;
  expiresAt?: unknown;
  hardStopCategories?: unknown;
}

export interface MayaAutonomyAuthorityIntakeRequest {
  target?: unknown;
  expectedAutonomyMode?: unknown;
  expectedGrantScope?: unknown;
  expectedSubjectRef?: unknown;
  expectedEthicsCharterRef?: unknown;
  decision?: MayaAutonomyAuthorityDecisionEvidence;
}

export interface NormalizedMayaAuthorityDecision {
  status: 'maya_autonomy_decision_allowed';
  authorityRef: string;
  decisionRef: string;
  subjectRef: string;
  autonomyMode: MayaAutonomyMode;
  grantScope: string;
  ethicsCharterRef: string;
  safetyEvidenceRef: string;
  issuedAt?: string;
  expiresAt?: string;
  hardStopCategories: string[];
}

export interface MayaAutonomyAuthoritySideEffects {
  callsMayaKaya: false;
  callsProviders: false;
  executesRuntime: false;
  writesFiles: false;
  writesDatabase: false;
  writesGitHub: false;
  persistsReceipts: false;
  issuesPermits: false;
  deploys: false;
  merges: false;
}

export interface MayaAutonomyAuthorityContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-autonomy-authority-intake-contract-v0.1';
  generatedAt: string;
  sourceOfTruth: 'maya_kaya';
  localAppRole: 'consumer_and_executor_guard';
  acceptedDecisionStatus: 'maya_autonomy_decision_allowed';
  targetHandoff: '/probe/activation-decision-operator-mode-preflight';
  autonomyModes: MayaAutonomyMode[];
  protectedTargets: MayaAutonomyTarget[];
  requiredDecisionFields: string[];
  hardStopCategories: string[];
  failClosedRules: string[];
  boundary: {
    validatesEvidenceOnly: true;
    callsMayaKaya: false;
    grantsAutonomyLocally: false;
    executesActions: false;
  };
  sideEffects: MayaAutonomyAuthoritySideEffects;
}

export interface MayaAutonomyAuthorityIntakePreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-autonomy-authority-intake-preflight-v0.1';
  generatedAt: string;
  status: MayaAutonomyIntakeStatus;
  target?: MayaAutonomyTarget;
  decisionReady: boolean;
  authoritySource: 'maya_kaya';
  blockers: string[];
  reviewItems: string[];
  normalizedDecision?: NormalizedMayaAuthorityDecision;
  activationDecisionHandoff?: {
    mayaAuthorityDecision: NormalizedMayaAuthorityDecision;
    target?: MayaAutonomyTarget;
  };
  nextStep: string;
  contract: MayaAutonomyAuthorityContract;
  sideEffects: MayaAutonomyAuthoritySideEffects;
}

const AUTONOMY_MODES: MayaAutonomyMode[] = ['read_only', 'review_only', 'supervised_execution', 'full_access'];
const TARGETS: MayaAutonomyTarget[] = ['provider_call', 'runtime_dry_run', 'write_action', 'durable_receipt_store'];
const REQUIRED_DECISION_FIELDS = [
  'status',
  'authorityRef',
  'decisionRef',
  'subjectRef',
  'autonomyMode',
  'grantScope',
  'ethicsCharterRef',
  'safetyEvidenceRef',
  'hardStopCategories',
];

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

function lockedSideEffects(): MayaAutonomyAuthoritySideEffects {
  return {
    callsMayaKaya: false,
    callsProviders: false,
    executesRuntime: false,
    writesFiles: false,
    writesDatabase: false,
    writesGitHub: false,
    persistsReceipts: false,
    issuesPermits: false,
    deploys: false,
    merges: false,
  };
}

export function buildMayaAutonomyAuthorityContract(now = new Date()): MayaAutonomyAuthorityContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-autonomy-authority-intake-contract-v0.1',
    generatedAt: now.toISOString(),
    sourceOfTruth: 'maya_kaya',
    localAppRole: 'consumer_and_executor_guard',
    acceptedDecisionStatus: 'maya_autonomy_decision_allowed',
    targetHandoff: '/probe/activation-decision-operator-mode-preflight',
    autonomyModes: AUTONOMY_MODES,
    protectedTargets: TARGETS,
    requiredDecisionFields: REQUIRED_DECISION_FIELDS,
    hardStopCategories: HARD_STOP_CATEGORIES,
    failClosedRules: [
      'missing_maya_kaya_decision_blocks_execution_handoff',
      'decision_status_must_be_maya_autonomy_decision_allowed',
      'decision_scope_must_match_requested_autonomy_mode',
      'full_access_requires_full_access_grant_scope',
      'expired_decision_blocks_execution_handoff',
      'decision_must_carry_the_shared_hard_stop_policy',
    ],
    boundary: {
      validatesEvidenceOnly: true,
      callsMayaKaya: false,
      grantsAutonomyLocally: false,
      executesActions: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildMayaAutonomyAuthorityIntakePreflight(
  request: MayaAutonomyAuthorityIntakeRequest,
  now = new Date(),
): MayaAutonomyAuthorityIntakePreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const target = normalizeTarget(request.target, blockers);
  const expectedAutonomyMode = normalizeOptionalAutonomyMode(request.expectedAutonomyMode, blockers);
  const expectedGrantScope = normalizeString(request.expectedGrantScope);
  const expectedSubjectRef = normalizeString(request.expectedSubjectRef);
  const expectedEthicsCharterRef = normalizeString(request.expectedEthicsCharterRef);
  const normalizedDecision = normalizeDecision(request.decision, {
    expectedAutonomyMode,
    expectedGrantScope,
    expectedSubjectRef,
    expectedEthicsCharterRef,
    now,
    blockers,
    reviewItems,
  });
  const decisionReady = blockers.length === 0 && !!normalizedDecision;
  const status: MayaAutonomyIntakeStatus = decisionReady ? 'ready_for_activation_review' : 'blocked';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-autonomy-authority-intake-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(target ? { target } : {}),
    decisionReady,
    authoritySource: 'maya_kaya',
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    ...(normalizedDecision ? { normalizedDecision } : {}),
    ...(decisionReady ? {
      activationDecisionHandoff: {
        mayaAuthorityDecision: normalizedDecision,
        ...(target ? { target } : {}),
      },
    } : {}),
    nextStep: status === 'ready_for_activation_review'
      ? 'Forward the normalized Maya/Kaya authority decision into activation-decision operator mode; Bluepilot still does not execute actions here.'
      : 'Collect a valid Maya/Kaya authority decision before any execution handoff.',
    contract: buildMayaAutonomyAuthorityContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function normalizeDecision(
  decision: MayaAutonomyAuthorityDecisionEvidence | undefined,
  options: {
    expectedAutonomyMode?: MayaAutonomyMode;
    expectedGrantScope?: string;
    expectedSubjectRef?: string;
    expectedEthicsCharterRef?: string;
    now: Date;
    blockers: string[];
    reviewItems: string[];
  },
): NormalizedMayaAuthorityDecision | undefined {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
    options.blockers.push('maya_autonomy_authority.decision_required');
    return undefined;
  }

  const status = normalizeString(decision.status);
  const authorityRef = normalizeString(decision.authorityRef);
  const decisionRef = normalizeString(decision.decisionRef);
  const subjectRef = normalizeString(decision.subjectRef);
  const autonomyMode = normalizeDecisionAutonomyMode(decision.autonomyMode, options.blockers);
  const grantScope = normalizeString(decision.grantScope);
  const ethicsCharterRef = normalizeString(decision.ethicsCharterRef);
  const safetyEvidenceRef = normalizeString(decision.safetyEvidenceRef);
  const issuedAt = normalizeOptionalIsoDate(decision.issuedAt, 'issuedAt', options.blockers);
  const expiresAt = normalizeOptionalIsoDate(decision.expiresAt, 'expiresAt', options.blockers);
  const hardStopCategories = normalizeStringArray(decision.hardStopCategories);

  if (status !== 'maya_autonomy_decision_allowed') {
    options.blockers.push('maya_autonomy_authority.decision_not_allowed');
  }
  requireRef(authorityRef, 'maya_autonomy_authority.authority_ref_required', options.blockers);
  requireRef(decisionRef, 'maya_autonomy_authority.decision_ref_required', options.blockers);
  requireRef(subjectRef, 'maya_autonomy_authority.subject_ref_required', options.blockers);
  requireRef(grantScope, 'maya_autonomy_authority.grant_scope_required', options.blockers);
  requireRef(ethicsCharterRef, 'maya_autonomy_authority.ethics_charta_ref_required', options.blockers);
  requireRef(safetyEvidenceRef, 'maya_autonomy_authority.safety_evidence_ref_required', options.blockers);

  if (autonomyMode === 'full_access' && grantScope !== 'full_access') {
    options.blockers.push('maya_autonomy_authority.full_access_scope_required');
  }
  if (options.expectedAutonomyMode && autonomyMode && options.expectedAutonomyMode !== autonomyMode) {
    options.blockers.push('maya_autonomy_authority.autonomy_mode_mismatch');
  }
  if (options.expectedGrantScope && grantScope && options.expectedGrantScope !== grantScope) {
    options.blockers.push('maya_autonomy_authority.grant_scope_mismatch');
  }
  if (options.expectedSubjectRef && subjectRef && options.expectedSubjectRef !== subjectRef) {
    options.blockers.push('maya_autonomy_authority.subject_ref_mismatch');
  }
  if (options.expectedEthicsCharterRef && ethicsCharterRef && options.expectedEthicsCharterRef !== ethicsCharterRef) {
    options.blockers.push('maya_autonomy_authority.ethics_charta_ref_mismatch');
  }
  if (expiresAt && Date.parse(expiresAt) <= options.now.getTime()) {
    options.blockers.push('maya_autonomy_authority.decision_expired');
  }

  for (const category of HARD_STOP_CATEGORIES) {
    if (!hardStopCategories.includes(category)) {
      options.blockers.push(`maya_autonomy_authority.hard_stop_policy_missing:${category}`);
    }
  }
  for (const category of hardStopCategories) {
    if (!HARD_STOP_CATEGORIES.includes(category)) {
      options.reviewItems.push(`maya_autonomy_authority.unrecognized_hard_stop_category:${category}`);
    }
  }

  if (
    status !== 'maya_autonomy_decision_allowed'
    || !authorityRef
    || !decisionRef
    || !subjectRef
    || !autonomyMode
    || !grantScope
    || !ethicsCharterRef
    || !safetyEvidenceRef
  ) {
    return undefined;
  }

  return {
    status: 'maya_autonomy_decision_allowed',
    authorityRef,
    decisionRef,
    subjectRef,
    autonomyMode,
    grantScope,
    ethicsCharterRef,
    safetyEvidenceRef,
    ...(issuedAt ? { issuedAt } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    hardStopCategories,
  };
}

function normalizeTarget(value: unknown, blockers: string[]): MayaAutonomyTarget | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    blockers.push('maya_autonomy_authority.target_invalid');
    return undefined;
  }
  const normalized = value.trim();
  if (!TARGETS.includes(normalized as MayaAutonomyTarget)) {
    blockers.push(`maya_autonomy_authority.unsupported_target:${normalized}`);
    return undefined;
  }
  return normalized as MayaAutonomyTarget;
}

function normalizeOptionalAutonomyMode(value: unknown, blockers: string[]): MayaAutonomyMode | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return normalizeDecisionAutonomyMode(value, blockers);
}

function normalizeDecisionAutonomyMode(value: unknown, blockers: string[]): MayaAutonomyMode | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('maya_autonomy_authority.autonomy_mode_required');
    return undefined;
  }
  const normalized = value.trim();
  if (!AUTONOMY_MODES.includes(normalized as MayaAutonomyMode)) {
    blockers.push(`maya_autonomy_authority.unsupported_autonomy_mode:${normalized}`);
    return undefined;
  }
  return normalized as MayaAutonomyMode;
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

function normalizeOptionalIsoDate(value: unknown, field: 'issuedAt' | 'expiresAt', blockers: string[]): string | undefined {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }
  if (Number.isNaN(Date.parse(normalized))) {
    blockers.push(`maya_autonomy_authority.${field}_invalid`);
    return undefined;
  }
  return normalized;
}

function requireRef(value: string | undefined, blocker: string, blockers: string[]): void {
  if (!value) {
    blockers.push(blocker);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
