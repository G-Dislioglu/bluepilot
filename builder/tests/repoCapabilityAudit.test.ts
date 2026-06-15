import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRepoCapabilityAudit } from '../src/repoCapabilityAudit.js';

test('repo capability audit prioritizes Soulmatch wiring without side effects', () => {
  const audit = buildRepoCapabilityAudit(new Date('2026-06-15T12:00:00.000Z'));

  assert.equal(audit.service, 'bluepilot-builder');
  assert.equal(audit.version, 'bluepilot-repo-capability-audit-v0.1');
  assert.equal(audit.generatedAt, '2026-06-15T12:00:00.000Z');
  assert.equal(audit.sideEffects.githubWrites, false);
  assert.equal(audit.sideEffects.providerCalls, false);
  assert.equal(audit.sideEffects.runtimeExecution, false);
  assert.equal(audit.sideEffects.merges, false);

  const soulmatch = audit.sources.find((source) => source.repo === 'soulmatch');
  assert.ok(soulmatch);
  assert.ok(soulmatch.observedCapabilities.some((capability) => capability.includes('/api/builder/patrol')));
  assert.ok(soulmatch.observedCapabilities.some((capability) => capability.includes('execution ledger')));

  const wired = audit.adoptionCandidates.find((candidate) => candidate.id === 'meta_and_capability_audit_surface');
  assert.equal(wired?.status, 'wired_read_only');
  assert.ok(wired?.blockedSideEffects.includes('githubWrites'));

  assert.equal(audit.recommendedNextSlice, 'bluepilot-operator-ledger-ui-v0.1');
});

test('repo capability audit returns defensive copies', () => {
  const first = buildRepoCapabilityAudit(new Date('2026-06-15T12:00:00.000Z'));
  first.sources[0]?.observedCapabilities.push('mutated');
  first.adoptionCandidates[0]?.blockedSideEffects.push('mutated');

  const second = buildRepoCapabilityAudit(new Date('2026-06-15T12:00:00.000Z'));

  assert.equal(second.sources[0]?.observedCapabilities.includes('mutated'), false);
  assert.equal(second.adoptionCandidates[0]?.blockedSideEffects.includes('mutated'), false);
});
