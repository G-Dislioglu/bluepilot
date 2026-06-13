import type { DispatchFrontendReadinessProjection } from './dispatchFrontendReadiness.js';

export type RuntimeDispatchAdoptionMode = 'disabled' | 'dry_run_only' | 'operator_approved_write';
export type RuntimeDispatchIntegrationStatus = 'runtime_candidate' | 'operator_review' | 'blocked';

export interface RuntimeDispatchIntegrationInput {
  readiness: DispatchFrontendReadinessProjection;
  mode: RuntimeDispatchAdoptionMode;
  requiredEvidence?: string[];
  authorityRef?: string;
}

export interface RuntimeDispatchIntegrationContract {
  status: RuntimeDispatchIntegrationStatus;
  dryRunAllowed: boolean;
  runtimeDispatchAllowed: boolean;
  writePermitRequired: boolean;
  authorityRef?: string;
  reasons: string[];
  contractTaskId: string;
  mode: RuntimeDispatchAdoptionMode;
  boundary: {
    executableRouteAllowed: false;
    providerCallAllowed: false;
    databaseWriteAllowed: false;
    githubWriteAllowed: false;
  };
  checklist: Array<{
    id: string;
    passed: boolean;
    detail: string;
  }>;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeEvidence(values: string[]): string[] {
  return unique(values.map((value) => value.trim()).filter(Boolean));
}

function collectMissingEvidence(input: RuntimeDispatchIntegrationInput): string[] {
  const available = new Set(normalizeEvidence(input.readiness.summary.evidenceRequirements));
  return normalizeEvidence(input.requiredEvidence ?? []).filter((evidence) => !available.has(evidence));
}

export function classifyRuntimeDispatchIntegration(
  input: RuntimeDispatchIntegrationInput,
): RuntimeDispatchIntegrationContract {
  const reasons: string[] = [];
  const missingEvidence = collectMissingEvidence(input);
  const authorityRef = input.authorityRef?.trim();

  if (input.mode === 'disabled') {
    reasons.push('runtime_integration.mode_disabled');
  }
  if (input.readiness.stage === 'blocked') {
    reasons.push('runtime_integration.readiness_blocked');
  }
  if (input.readiness.stage === 'frontend_review') {
    reasons.push('runtime_integration.readiness_review_required');
  }
  for (const evidence of missingEvidence) {
    reasons.push(`runtime_integration.missing_required_evidence:${evidence}`);
  }
  if (input.mode === 'operator_approved_write' && !authorityRef) {
    reasons.push('runtime_integration.authority_ref_required');
  }

  const blocking = reasons.some((reason) =>
    reason === 'runtime_integration.mode_disabled'
    || reason === 'runtime_integration.readiness_blocked'
    || reason.startsWith('runtime_integration.missing_required_evidence:'),
  );
  const review = !blocking && reasons.length > 0;
  const status: RuntimeDispatchIntegrationStatus = blocking
    ? 'blocked'
    : review
      ? 'operator_review'
      : 'runtime_candidate';
  const dryRunAllowed = status === 'runtime_candidate'
    && input.mode !== 'disabled'
    && input.readiness.stage === 'dispatch_ready';
  const runtimeDispatchAllowed = dryRunAllowed
    && input.mode === 'operator_approved_write'
    && Boolean(authorityRef);

  return {
    status,
    dryRunAllowed,
    runtimeDispatchAllowed,
    writePermitRequired: input.mode === 'operator_approved_write',
    ...(authorityRef ? { authorityRef } : {}),
    reasons: unique(reasons),
    contractTaskId: input.readiness.contractTaskId,
    mode: input.mode,
    boundary: {
      executableRouteAllowed: false,
      providerCallAllowed: false,
      databaseWriteAllowed: false,
      githubWriteAllowed: false,
    },
    checklist: [
      {
        id: 'readiness_dispatch_ready',
        passed: input.readiness.stage === 'dispatch_ready',
        detail: input.readiness.stage,
      },
      {
        id: 'required_evidence_present',
        passed: missingEvidence.length === 0,
        detail: missingEvidence.length === 0 ? 'complete' : missingEvidence.join(','),
      },
      {
        id: 'authority_reference_present',
        passed: input.mode !== 'operator_approved_write' || Boolean(authorityRef),
        detail: authorityRef ?? 'missing',
      },
      {
        id: 'runtime_side_effects_closed',
        passed: true,
        detail: 'contract_only',
      },
    ],
  };
}
