import type { CardConditionedDispatchPlan } from './cardConditionedDispatch.js';
import type { PreRegisteredClaimsGateResult } from './preRegisteredClaims.js';
import type { WlpContractDraft } from './workerPacketWlpAdapter.js';

export type DispatchFrontendReadinessStage = 'dispatch_ready' | 'frontend_review' | 'blocked';
export type DispatchFrontendSurface = 'operator_cockpit' | 'review_packet' | 'dispatch_preflight';
export type DispatchFrontendSectionStatus = 'ready' | 'review' | 'blocked';

export interface DispatchFrontendReadinessInput {
  contract: WlpContractDraft;
  dispatchPlan: CardConditionedDispatchPlan;
  claimGate: PreRegisteredClaimsGateResult;
  surface?: DispatchFrontendSurface;
}

export interface DispatchFrontendReadinessSection {
  id: string;
  title: string;
  status: DispatchFrontendSectionStatus;
  items: string[];
}

export interface DispatchFrontendReadinessProjection {
  stage: DispatchFrontendReadinessStage;
  dispatchAllowed: boolean;
  frontendProjectionAllowed: boolean;
  reviewRequired: boolean;
  reasons: string[];
  contractTaskId: string;
  surface: DispatchFrontendSurface;
  summary: {
    allowedFileCount: number;
    cardCount: number;
    claimCount: number;
    evidenceRequirements: string[];
  };
  gates: {
    cardConditionedDispatch: CardConditionedDispatchPlan['decision'];
    preRegisteredClaims: PreRegisteredClaimsGateResult['decision'];
    contractEvidence: DispatchFrontendSectionStatus;
  };
  frontendSections: DispatchFrontendReadinessSection[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function sectionStatusFromDecision(decision: 'allow' | 'review_required' | 'blocked'): DispatchFrontendSectionStatus {
  if (decision === 'blocked') {
    return 'blocked';
  }
  if (decision === 'review_required') {
    return 'review';
  }
  return 'ready';
}

function collectReadinessReasons(input: DispatchFrontendReadinessInput): string[] {
  const reasons: string[] = [];

  if (input.dispatchPlan.contractTaskId !== input.contract.task_id) {
    reasons.push(`dispatch_frontend.contract_task_mismatch:${input.dispatchPlan.contractTaskId}->${input.contract.task_id}`);
  }

  if (input.contract.evidence_required.length === 0) {
    reasons.push('dispatch_frontend.evidence_required_empty');
  }

  reasons.push(...input.dispatchPlan.reasons);
  reasons.push(...input.claimGate.reasons);

  return unique(reasons);
}

function isReviewReason(reason: string): boolean {
  return reason.includes('.review_required')
    || reason.endsWith('dispatch_plan_review_required');
}

function hasBlockingReason(input: DispatchFrontendReadinessInput, reasons: string[]): boolean {
  return reasons.some((reason) => !isReviewReason(reason))
    || input.dispatchPlan.decision === 'blocked'
    || input.claimGate.decision === 'blocked';
}

function hasReviewReason(input: DispatchFrontendReadinessInput): boolean {
  return input.dispatchPlan.decision === 'review_required'
    || input.claimGate.decision === 'review_required'
    || input.dispatchPlan.reviewRequired
    || input.claimGate.reviewRequired;
}

function buildSections(
  input: DispatchFrontendReadinessInput,
  contractEvidenceStatus: DispatchFrontendSectionStatus,
  finalStatus: DispatchFrontendSectionStatus,
): DispatchFrontendReadinessSection[] {
  return [
    {
      id: 'contract_scope',
      title: 'Contract scope',
      status: contractEvidenceStatus,
      items: [
        `task:${input.contract.task_id}`,
        `allowed_files:${input.contract.allowed_files.length}`,
        `evidence_required:${input.contract.evidence_required.length}`,
      ],
    },
    {
      id: 'card_conditioned_dispatch',
      title: 'Card-conditioned dispatch',
      status: sectionStatusFromDecision(input.dispatchPlan.decision),
      items: [
        `decision:${input.dispatchPlan.decision}`,
        `cards:${input.dispatchPlan.cards.length}`,
      ],
    },
    {
      id: 'pre_registered_claims',
      title: 'Pre-registered claims',
      status: sectionStatusFromDecision(input.claimGate.decision),
      items: [
        `decision:${input.claimGate.decision}`,
        `claims:${input.claimGate.registeredClaims.length}`,
      ],
    },
    {
      id: 'dispatch_decision',
      title: 'Dispatch decision',
      status: finalStatus,
      items: [
        `dispatch_allowed:${finalStatus === 'ready'}`,
        `frontend_projection_allowed:true`,
      ],
    },
  ];
}

export function projectDispatchFrontendReadiness(
  input: DispatchFrontendReadinessInput,
): DispatchFrontendReadinessProjection {
  const surface = input.surface ?? 'operator_cockpit';
  const reasons = collectReadinessReasons(input);
  const contractEvidenceStatus: DispatchFrontendSectionStatus = input.contract.evidence_required.length > 0
    && input.dispatchPlan.contractTaskId === input.contract.task_id
    ? 'ready'
    : 'blocked';
  const blocked = hasBlockingReason(input, reasons);
  const reviewRequired = !blocked && hasReviewReason(input);
  const dispatchAllowed = !blocked
    && !reviewRequired
    && input.dispatchPlan.dispatchAllowed
    && input.claimGate.dispatchAllowed;
  const stage: DispatchFrontendReadinessStage = dispatchAllowed
    ? 'dispatch_ready'
    : reviewRequired
      ? 'frontend_review'
      : 'blocked';
  const finalStatus: DispatchFrontendSectionStatus = stage === 'dispatch_ready'
    ? 'ready'
    : stage === 'frontend_review'
      ? 'review'
      : 'blocked';

  return {
    stage,
    dispatchAllowed,
    frontendProjectionAllowed: true,
    reviewRequired,
    reasons,
    contractTaskId: input.contract.task_id,
    surface,
    summary: {
      allowedFileCount: input.contract.allowed_files.length,
      cardCount: input.dispatchPlan.cards.length,
      claimCount: input.claimGate.registeredClaims.length,
      evidenceRequirements: [...input.contract.evidence_required],
    },
    gates: {
      cardConditionedDispatch: input.dispatchPlan.decision,
      preRegisteredClaims: input.claimGate.decision,
      contractEvidence: contractEvidenceStatus,
    },
    frontendSections: buildSections(input, contractEvidenceStatus, finalStatus),
  };
}
