import {
  buildMayaAutonomyAuthorityIntakePreflight,
  type MayaAutonomyAuthorityDecisionEvidence,
  type MayaAutonomyMode,
  type MayaAutonomyTarget,
} from './mayaAutonomyAuthorityIntake.js';

export interface MayaCoreAutonomyVerificationPreflightRequest {
  target?: unknown;
  expectedAutonomyMode?: unknown;
  expectedGrantScope?: unknown;
  expectedSubjectRef?: unknown;
  expectedEthicsCharterRef?: unknown;
  decision?: MayaAutonomyAuthorityDecisionEvidence;
  mayaCoreUrlConfigured?: unknown;
  mayaCoreGateTokenConfigured?: unknown;
  verificationEndpoint?: unknown;
}

export interface MayaCoreAutonomyVerificationSideEffects {
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

export interface MayaCoreAutonomyVerificationContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-autonomy-verification-contract-v0.1';
  generatedAt: string;
  mayaCoreEndpoint: '/api/maya/autonomy/authority';
  sourceOfTruth: 'maya_kaya';
  localAppRole: 'consumer_and_executor_guard';
  requiredEvidence: string[];
  boundary: {
    validatesLiveVerificationReadinessOnly: true;
    callsMayaKaya: false;
    executesActions: false;
    grantsAutonomyLocally: false;
  };
  sideEffects: MayaCoreAutonomyVerificationSideEffects;
}

export interface MayaCoreAutonomyVerificationPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-maya-core-autonomy-verification-preflight-v0.1';
  generatedAt: string;
  status: 'ready_for_live_verification_review' | 'blocked';
  target?: MayaAutonomyTarget;
  expectedAutonomyMode?: MayaAutonomyMode;
  blockers: string[];
  reviewItems: string[];
  liveVerificationReady: boolean;
  plannedRequest?: {
    method: 'POST';
    path: '/api/maya/autonomy/authority';
    mode: 'verify';
    sendGateTokenHeader: true;
    body: {
      mode: 'verify';
      verify: {
        decision: MayaAutonomyAuthorityDecisionEvidence;
        expectedAutonomyMode?: MayaAutonomyMode;
        expectedGrantScope?: string;
        expectedSubjectRef?: string;
        expectedEthicsCharterRef?: string;
      };
    };
  };
  intakeReady: boolean;
  nextStep: string;
  contract: MayaCoreAutonomyVerificationContract;
  sideEffects: MayaCoreAutonomyVerificationSideEffects;
}

function lockedSideEffects(): MayaCoreAutonomyVerificationSideEffects {
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

export function buildMayaCoreAutonomyVerificationContract(
  now = new Date(),
): MayaCoreAutonomyVerificationContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-autonomy-verification-contract-v0.1',
    generatedAt: now.toISOString(),
    mayaCoreEndpoint: '/api/maya/autonomy/authority',
    sourceOfTruth: 'maya_kaya',
    localAppRole: 'consumer_and_executor_guard',
    requiredEvidence: [
      'MAYA_CORE_URL configured',
      'MAYA_CORE_GATE_TOKEN or MAYA_BUILDER_GATE_TOKEN configured',
      'mayaAuthorityDecision.status == maya_autonomy_decision_allowed',
      'matching expected autonomy mode and grant scope',
      'shared hard-stop policy carried by the decision',
    ],
    boundary: {
      validatesLiveVerificationReadinessOnly: true,
      callsMayaKaya: false,
      executesActions: false,
      grantsAutonomyLocally: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildMayaCoreAutonomyVerificationPreflight(
  request: MayaCoreAutonomyVerificationPreflightRequest,
  now = new Date(),
): MayaCoreAutonomyVerificationPreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  if (request.mayaCoreUrlConfigured !== true) {
    blockers.push('maya_core_autonomy.maya_core_url_required');
  }
  if (request.mayaCoreGateTokenConfigured !== true) {
    blockers.push('maya_core_autonomy.gate_token_required');
  }
  if (request.verificationEndpoint !== undefined && request.verificationEndpoint !== '/api/maya/autonomy/authority') {
    blockers.push('maya_core_autonomy.unsupported_verification_endpoint');
  }

  const intake = buildMayaAutonomyAuthorityIntakePreflight({
    target: request.target,
    expectedAutonomyMode: request.expectedAutonomyMode,
    expectedGrantScope: request.expectedGrantScope,
    expectedSubjectRef: request.expectedSubjectRef,
    expectedEthicsCharterRef: request.expectedEthicsCharterRef,
    decision: request.decision,
  }, now);
  blockers.push(...intake.blockers.map((blocker) => `intake.${blocker}`));
  reviewItems.push(...intake.reviewItems.map((item) => `intake.${item}`));

  const liveVerificationReady = blockers.length === 0 && intake.decisionReady && !!intake.normalizedDecision;
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-maya-core-autonomy-verification-preflight-v0.1',
    generatedAt: now.toISOString(),
    status: liveVerificationReady ? 'ready_for_live_verification_review' : 'blocked',
    ...(intake.target ? { target: intake.target } : {}),
    ...(intake.normalizedDecision ? { expectedAutonomyMode: intake.normalizedDecision.autonomyMode } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    liveVerificationReady,
    ...(liveVerificationReady && intake.normalizedDecision ? {
      plannedRequest: {
        method: 'POST',
        path: '/api/maya/autonomy/authority',
        mode: 'verify',
        sendGateTokenHeader: true,
        body: {
          mode: 'verify',
          verify: {
            decision: intake.normalizedDecision,
            ...(typeof request.expectedAutonomyMode === 'string' ? { expectedAutonomyMode: request.expectedAutonomyMode as MayaAutonomyMode } : {}),
            ...(typeof request.expectedGrantScope === 'string' ? { expectedGrantScope: request.expectedGrantScope } : {}),
            ...(typeof request.expectedSubjectRef === 'string' ? { expectedSubjectRef: request.expectedSubjectRef } : {}),
            ...(typeof request.expectedEthicsCharterRef === 'string' ? { expectedEthicsCharterRef: request.expectedEthicsCharterRef } : {}),
          },
        },
      },
    } : {}),
    intakeReady: intake.decisionReady,
    nextStep: liveVerificationReady
      ? 'Operator may enable the live Maya-core verify call in a separate activation step; this preflight did not call Maya/Kaya.'
      : 'Collect Maya-core configuration and a valid Maya/Kaya authority decision before live verification review.',
    contract: buildMayaCoreAutonomyVerificationContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
