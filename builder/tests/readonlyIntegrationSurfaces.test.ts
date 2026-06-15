import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAicosPermissionMapReadonly,
  buildBpkExecutionLedgerReadonly,
  buildPatrolVisualCoverageReadonly,
  buildRepoMutationKillSwitchReadonly,
} from '../src/readonlyIntegrationSurfaces.js';

const now = new Date('2026-06-15T13:00:00.000Z');

test('BPK execution ledger exposes four read-only lanes', () => {
  const ledger = buildBpkExecutionLedgerReadonly(now);

  assert.equal(ledger.version, 'bluepilot-bpk-execution-ledger-readonly-v0.1');
  assert.equal(ledger.bpkPath.completed, 226);
  assert.equal(ledger.stages.length, 4);
  assert.deepEqual(ledger.stages.map((stage) => stage.lane), ['cockpit', 'memory', 'runtime', 'release']);
  assert.equal(ledger.stages.every((stage) => stage.executeAllowed === false), true);
  assert.equal(ledger.sideEffects.githubWrites, false);
  assert.equal(ledger.sideEffects.runtimeExecution, false);
});

test('patrol visual coverage ports Soulmatch route focus as contract only', () => {
  const coverage = buildPatrolVisualCoverageReadonly(now);

  assert.equal(coverage.version, 'bluepilot-patrol-visual-coverage-contract-v0.1');
  assert.ok(coverage.routes.some((route) => route.route === '/builder?drawer=visual'));
  assert.ok(coverage.blockedActions.includes('screen_capture'));
  assert.ok(coverage.blockedActions.includes('repair_task_creation'));
  assert.equal(coverage.sideEffects.fileWrites, false);
  assert.equal(coverage.sideEffects.providerCalls, false);
});

test('repo mutation kill switch is locked read-only', () => {
  const killSwitch = buildRepoMutationKillSwitchReadonly(now);

  assert.equal(killSwitch.state, 'locked');
  assert.ok(killSwitch.protectedSurfaces.includes('/probe/sandbox-write'));
  assert.ok(killSwitch.writeEnablementRequires.includes('one-shot permit'));
  assert.equal(killSwitch.sideEffects.githubWrites, false);
  assert.equal(killSwitch.sideEffects.durablePersistence, false);
});

test('AICOS permission map keeps every permission disabled by default', () => {
  const permissionMap = buildAicosPermissionMapReadonly(now);

  assert.equal(permissionMap.version, 'bluepilot-aicos-permission-map-readonly-v0.1');
  assert.ok(permissionMap.entries.some((entry) => entry.bluepilotSurface === 'goat_desktop_local_bridge'));
  assert.equal(permissionMap.entries.every((entry) => entry.allowedByDefault === false), true);
  assert.equal(permissionMap.sideEffects.providerCalls, false);
});
