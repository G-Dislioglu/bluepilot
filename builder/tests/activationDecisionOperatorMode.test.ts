import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildActivationDecisionOperatorModeContract,
  buildActivationDecisionOperatorModePreflight,
} from '../src/activationDecisionOperatorMode.js';

const readyExecutor = {
  status: 'executor_mount_lock_ready',
  executorMountReady: true,
};

const readyStore = {
  status: 'store_ready_for_activation_review',
  storeReady: true,
};

function fullAccessRequest() {
  return {
    autonomyMode: 'full_access',
    target: 'runtime_dry_run',
    operatorGrantRef: 'operator:grant:full-access-session',
    operatorGrantScope: 'full_access',
    activationDecisionRef: 'activation:decision:runtime',
    ethicsCharterRef: 'maya-ethics-charter:canonical',
    safetyEvidenceRef: 'safety:evidence:runtime',
    userIntentRef: 'user:intent:continue-autonomously',
    executorEvidence: readyExecutor,
    durableReceiptStore: readyStore,
  };
}

test('activation decision contract defines autonomy modes and hard stops', () => {
  const contract = buildActivationDecisionOperatorModeContract(new Date('2026-06-16T15:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-activation-decision-operator-mode-contract-v0.1');
  assert.ok(contract.autonomyModes.includes('full_access'));
  assert.ok(contract.hardStopCategories.includes('banking'));
  assert.equal(contract.decisionBoundary.evaluatesOnly, true);
  assert.equal(contract.decisionBoundary.executesRuntime, false);
  assert.equal(contract.sideEffects.runtimeExecution, false);
});

test('full access can allow execution without repeated prompts when evidence is ready', () => {
  const preflight = buildActivationDecisionOperatorModePreflight(fullAccessRequest(), new Date('2026-06-16T15:00:00.000Z'));

  assert.equal(preflight.status, 'execute_allowed');
  assert.equal(preflight.executeAllowed, true);
  assert.equal(preflight.repeatedPromptRequired, false);
  assert.equal(preflight.operatorGrantCarriesForward, true);
  assert.equal(preflight.allowedActions.runtimeDryRun, true);
  assert.equal(preflight.allowedActions.providerCall, false);
  assert.equal(preflight.sideEffects.runtimeExecution, false);
});

test('review-only mode never allows execution', () => {
  const preflight = buildActivationDecisionOperatorModePreflight({
    autonomyMode: 'review_only',
    target: 'provider_call',
    userIntentRef: 'user:intent:inspect',
    activationDecisionRef: 'activation:decision:provider',
  }, new Date('2026-06-16T15:00:00.000Z'));

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.executeAllowed, false);
  assert.equal(preflight.repeatedPromptRequired, true);
  assert.ok(preflight.reviewItems.includes('activation_decision.review_only_mode_never_executes'));
});

test('banking or charter-prohibited categories block even in full access', () => {
  const preflight = buildActivationDecisionOperatorModePreflight({
    ...fullAccessRequest(),
    bankingOrFinancialAction: true,
    prohibitedActionCategories: ['ethics_charter_violation'],
  }, new Date('2026-06-16T15:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.executeAllowed, false);
  assert.ok(preflight.blockers.includes('activation_decision.hard_stop:banking_or_financial_action'));
  assert.ok(preflight.blockers.includes('activation_decision.hard_stop:ethics_charter_violation'));
});

test('supervised execution requires a per-action approval ref', () => {
  const preflight = buildActivationDecisionOperatorModePreflight({
    ...fullAccessRequest(),
    autonomyMode: 'supervised_execution',
    operatorGrantScope: 'task',
  }, new Date('2026-06-16T15:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('activation_decision.per_action_approval_ref_required'));
  assert.equal(preflight.repeatedPromptRequired, true);
});
