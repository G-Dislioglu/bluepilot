import type { CardConditionedDispatchPlan } from './cardConditionedDispatch.js';
import type { WlpContractDraft } from './workerPacketWlpAdapter.js';

export type PreRegisteredClaimDecision = 'allow' | 'review_required' | 'blocked';

export interface ClaimEvidenceRegistration {
  type: 'edit_path' | 'scope_path' | 'card_ref' | 'review_packet' | 'other';
  ref: string;
}

export interface PreRegisteredClaim {
  claimId: string;
  text: string;
  evidence: ClaimEvidenceRegistration[];
}

export interface PreRegisteredClaimsInput {
  contract: WlpContractDraft;
  dispatchPlan: CardConditionedDispatchPlan;
  registrations: PreRegisteredClaim[];
}

export interface PreRegisteredClaimsGateResult {
  decision: PreRegisteredClaimDecision;
  dispatchAllowed: boolean;
  reviewRequired: boolean;
  reasons: string[];
  registeredClaims: Array<{
    claimId: string;
    text: string;
    evidenceCount: number;
  }>;
}

const CLAIM_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,120}$/;

function normalizeClaimText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validateRegistration(registration: PreRegisteredClaim): string[] {
  const errors: string[] = [];
  const claimId = registration.claimId.trim();
  if (!CLAIM_ID_RE.test(claimId)) {
    errors.push(`pre_registered_claim.invalid_claim_id:${registration.claimId}`);
  }
  if (!normalizeClaimText(registration.text)) {
    errors.push(`pre_registered_claim.text_required:${claimId || '(empty)'}`);
  }
  if (!Array.isArray(registration.evidence) || registration.evidence.length === 0) {
    errors.push(`pre_registered_claim.evidence_required:${claimId || '(empty)'}`);
  }
  for (const evidence of registration.evidence ?? []) {
    if (!evidence.ref.trim()) {
      errors.push(`pre_registered_claim.evidence_ref_required:${claimId || '(empty)'}`);
    }
  }
  return errors;
}

export function evaluatePreRegisteredClaims(input: PreRegisteredClaimsInput): PreRegisteredClaimsGateResult {
  const reasons: string[] = [];
  const contractClaims = input.contract.claims.map(normalizeClaimText).filter(Boolean);
  const registrations = input.registrations;
  const registrationTexts = registrations.map((registration) => normalizeClaimText(registration.text));

  if (contractClaims.length === 0) {
    reasons.push('pre_registered_claim.contract_claims_required');
  }

  const duplicateIds = registrations
    .map((registration) => registration.claimId.trim())
    .filter((claimId, index, claimIds) => claimId && claimIds.indexOf(claimId) !== index);
  if (duplicateIds.length > 0) {
    reasons.push(`pre_registered_claim.duplicate_claim_id:${unique(duplicateIds).join(',')}`);
  }

  for (const registration of registrations) {
    reasons.push(...validateRegistration(registration));
  }

  for (const claimText of contractClaims) {
    if (!registrationTexts.includes(claimText)) {
      reasons.push(`pre_registered_claim.missing_registration:${claimText}`);
    }
  }

  for (const registrationText of registrationTexts.filter(Boolean)) {
    if (!contractClaims.includes(registrationText)) {
      reasons.push(`pre_registered_claim.unexpected_registration:${registrationText}`);
    }
  }

  if (input.dispatchPlan.decision === 'blocked') {
    reasons.push('pre_registered_claim.dispatch_plan_blocked');
  } else if (input.dispatchPlan.decision === 'review_required') {
    reasons.push('pre_registered_claim.dispatch_plan_review_required');
  }

  const blockingReasons = reasons.filter((reason) =>
    !reason.endsWith('dispatch_plan_review_required'),
  );
  const decision: PreRegisteredClaimDecision = blockingReasons.length > 0
    ? 'blocked'
    : reasons.includes('pre_registered_claim.dispatch_plan_review_required')
      ? 'review_required'
      : 'allow';

  return {
    decision,
    dispatchAllowed: decision === 'allow' && input.dispatchPlan.dispatchAllowed,
    reviewRequired: decision === 'review_required',
    reasons: unique(reasons),
    registeredClaims: registrations.map((registration) => ({
      claimId: registration.claimId.trim(),
      text: normalizeClaimText(registration.text),
      evidenceCount: registration.evidence.length,
    })),
  };
}
