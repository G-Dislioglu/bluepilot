import assert from 'node:assert/strict';

import type { DispatchFrontendReadinessProjection } from '../src/dispatchFrontendReadiness.js';
import { classifyRuntimeDispatchIntegration } from '../src/runtimeDispatchIntegrationContract.js';

const readiness: DispatchFrontendReadinessProjection = {
  stage: 'dispatch_ready',
  dispatchAllowed: true,
  frontendProjectionAllowed: true,
  reviewRequired: false,
  reasons: [],
  contractTaskId: 'BPK-903',
  surface: 'operator_cockpit',
  summary: {
    allowedFileCount: 2,
    cardCount: 1,
    claimCount: 1,
    evidenceRequirements: ['test_result', 'diff_ref'],
  },
  gates: {
    cardConditionedDispatch: 'allow',
    preRegisteredClaims: 'allow',
    contractEvidence: 'ready',
  },
  frontendSections: [],
};

function testDryRunCandidate(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness,
    mode: 'dry_run_only',
    requiredEvidence: ['test_result'],
  });

  assert.equal(contract.status, 'runtime_candidate');
  assert.equal(contract.dryRunAllowed, true);
  assert.equal(contract.runtimeDispatchAllowed, false);
  assert.equal(contract.writePermitRequired, false);
  assert.deepEqual(contract.reasons, []);
  assert.equal(contract.boundary.executableRouteAllowed, false);
}

function testWriteCandidateRequiresAuthorityAndAllowsRuntimeDispatch(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness,
    mode: 'operator_approved_write',
    requiredEvidence: ['test_result', 'diff_ref'],
    authorityRef: 'permit-authority://BPK-903/operator-approved',
  });

  assert.equal(contract.status, 'runtime_candidate');
  assert.equal(contract.dryRunAllowed, true);
  assert.equal(contract.runtimeDispatchAllowed, true);
  assert.equal(contract.writePermitRequired, true);
  assert.equal(contract.authorityRef, 'permit-authority://BPK-903/operator-approved');
}

function testMissingAuthorityStaysOperatorReview(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness,
    mode: 'operator_approved_write',
  });

  assert.equal(contract.status, 'operator_review');
  assert.equal(contract.dryRunAllowed, false);
  assert.equal(contract.runtimeDispatchAllowed, false);
  assert.ok(contract.reasons.includes('runtime_integration.authority_ref_required'));
}

function testBlockedReadinessBlocks(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness: { ...readiness, stage: 'blocked', dispatchAllowed: false },
    mode: 'dry_run_only',
  });

  assert.equal(contract.status, 'blocked');
  assert.equal(contract.dryRunAllowed, false);
  assert.ok(contract.reasons.includes('runtime_integration.readiness_blocked'));
}

function testReviewReadinessRequiresOperatorReview(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness: { ...readiness, stage: 'frontend_review', dispatchAllowed: false, reviewRequired: true },
    mode: 'dry_run_only',
  });

  assert.equal(contract.status, 'operator_review');
  assert.equal(contract.dryRunAllowed, false);
  assert.ok(contract.reasons.includes('runtime_integration.readiness_review_required'));
}

function testMissingEvidenceBlocks(): void {
  const contract = classifyRuntimeDispatchIntegration({
    readiness,
    mode: 'dry_run_only',
    requiredEvidence: ['test_result', 'screenshot_check'],
  });

  assert.equal(contract.status, 'blocked');
  assert.equal(contract.dryRunAllowed, false);
  assert.ok(contract.reasons.includes('runtime_integration.missing_required_evidence:screenshot_check'));
  assert.equal(contract.checklist.find((item) => item.id === 'required_evidence_present')?.passed, false);
}

testDryRunCandidate();
testWriteCandidateRequiresAuthorityAndAllowsRuntimeDispatch();
testMissingAuthorityStaysOperatorReview();
testBlockedReadinessBlocks();
testReviewReadinessRequiresOperatorReview();
testMissingEvidenceBlocks();

console.log('runtimeDispatchIntegrationContract tests passed');
