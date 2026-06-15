import assert from 'node:assert/strict';

import { issueCockpitPatchPermitAuthority } from '../src/cockpitPatchPermitIssueAuthority.js';
import type { CockpitPatchPermitIssuePreflight } from '../src/cockpitPatchPermitIssuePreflight.js';

const preflight: CockpitPatchPermitIssuePreflight = {
  status: 'ready',
  permitIssuePreflightAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  preflightRef: 'preflight:cockpit',
  issuerRef: 'issuer:authority',
  issuePolicyRef: 'policy:permit-issue',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-107.md'],
  permitIssue: { kind: 'cockpit_patch_permit_issue_preflight', permitKind: 'cockpit_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityIssuesSideEffectFreePermit(): void {
  const authority = issueCockpitPatchPermitAuthority({
    preflight,
    permitId: 'permit:cockpit',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitIssueAuthorityAllowed, true);
  assert.equal(authority.permitIssued, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.issuedPermit.kind, 'cockpit_patch_application_permit');
}

function testMissingPermitIdRequiresReview(): void {
  const authority = issueCockpitPatchPermitAuthority({
    preflight,
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_issue_authority.permit_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = issueCockpitPatchPermitAuthority({
    preflight: { ...preflight, status: 'blocked', permitIssuePreflightAllowed: false, blockers: ['blocked'] },
    permitId: 'permit:cockpit',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_issue_authority.preflight_not_allowed'));
}

testReadyAuthorityIssuesSideEffectFreePermit();
testMissingPermitIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitIssueAuthority tests passed');
