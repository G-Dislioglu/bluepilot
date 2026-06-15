import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEightPointIntegrationReadiness,
  buildOperatorDashboardModel,
} from '../src/eightPointIntegrationReadiness.js';

test('eight point readiness covers all requested wiring areas without side effects', () => {
  const readiness = buildEightPointIntegrationReadiness(new Date('2026-06-15T14:00:00.000Z'));

  assert.equal(readiness.version, 'bluepilot-eight-point-integration-readiness-v0.1');
  assert.equal(readiness.summary.totalPoints, 8);
  assert.equal(readiness.summary.wiredReadOnly, 4);
  assert.equal(readiness.summary.wiredContractOnly, 3);
  assert.equal(readiness.summary.lockedForLaterActivation, 1);
  assert.equal(readiness.points.find((point) => point.id === 'goat_desktop_bridge')?.status, 'wired_contract_only');
  assert.equal(readiness.points.find((point) => point.id === 'goat_desktop_bridge')?.endpoint, '/probe/goat-desktop-bridge-contract');
  assert.equal(readiness.points.find((point) => point.id === 'maya_core_gate_enforcement')?.status, 'wired_contract_only');
  assert.equal(readiness.points.find((point) => point.id === 'maya_core_gate_enforcement')?.endpoint, '/probe/maya-core-gate-enforcement');
  assert.equal(readiness.points.find((point) => point.id === 'provider_runtime_flows')?.status, 'wired_contract_only');
  assert.equal(readiness.points.find((point) => point.id === 'provider_runtime_flows')?.endpoint, '/probe/provider-runtime-activation-contract');
  assert.deepEqual(readiness.points.map((point) => point.id), [
    'operator_ledger_ui',
    'soulmatch_builder_patrol_ui',
    'repo_mutation_kill_switch',
    'aicos_permission_review',
    'goat_desktop_bridge',
    'maya_core_gate_enforcement',
    'provider_runtime_flows',
    'merge_release_readiness',
  ]);
  assert.equal(readiness.sideEffects.githubWrites, false);
  assert.equal(readiness.sideEffects.providerCalls, false);
  assert.equal(readiness.sideEffects.runtimeExecution, false);
  assert.equal(readiness.sideEffects.merges, false);
  assert.equal(readiness.sideEffects.deploys, false);
});

test('operator dashboard model summarizes eight panels', () => {
  const model = buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z'));

  assert.equal(model.version, 'bluepilot-operator-dashboard-readonly-v0.1');
  assert.equal(model.panels.length, 8);
  assert.equal(model.panels.find((panel) => panel.id === 'goat_desktop_bridge')?.status, 'wired_contract_only');
  assert.equal(model.panels.find((panel) => panel.id === 'maya_core_gate_enforcement')?.status, 'wired_contract_only');
  assert.equal(model.panels.find((panel) => panel.id === 'provider_runtime_flows')?.status, 'wired_contract_only');
  assert.ok(model.panels.some((panel) => panel.id === 'merge_release_readiness'));
  assert.equal(model.sideEffects.fileWrites, false);
});
