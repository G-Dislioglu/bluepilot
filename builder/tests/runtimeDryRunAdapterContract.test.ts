import assert from 'node:assert/strict';

import type { RuntimeDispatchIntegrationContract } from '../src/runtimeDispatchIntegrationContract.js';
import { planRuntimeDryRunAdapter } from '../src/runtimeDryRunAdapterContract.js';

const integration: RuntimeDispatchIntegrationContract = {
  status: 'runtime_candidate',
  dryRunAllowed: true,
  runtimeDispatchAllowed: false,
  writePermitRequired: false,
  reasons: [],
  contractTaskId: 'BPK-903',
  mode: 'dry_run_only',
  boundary: {
    executableRouteAllowed: false,
    providerCallAllowed: false,
    databaseWriteAllowed: false,
    githubWriteAllowed: false,
  },
  checklist: [],
};

function testReadyDryRunPlan(): void {
  const plan = planRuntimeDryRunAdapter({
    integration,
    instruction: ' Inspect a harmless dry-run task. ',
    requestedBy: ' operator ',
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.dryRunInvocationAllowed, true);
  assert.equal(plan.runtimeDispatchAllowed, false);
  assert.equal(plan.instruction, 'Inspect a harmless dry-run task.');
  assert.equal(plan.requestedBy, 'operator');
  assert.deepEqual(plan.invocation, {
    dryRun: true,
    skipDeploy: true,
    allowProviderCalls: false,
    allowDatabaseWrites: false,
    allowGitHubWrites: false,
    allowRuntimeRoute: false,
  });
}

function testBlockedIntegrationBlocks(): void {
  const plan = planRuntimeDryRunAdapter({
    integration: { ...integration, status: 'blocked', dryRunAllowed: false },
    instruction: 'dry run',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('runtime_dry_run.integration_blocked'));
  assert.ok(plan.blockers.includes('runtime_dry_run.integration_dry_run_not_allowed'));
}

function testReviewIntegrationRequiresReview(): void {
  const plan = planRuntimeDryRunAdapter({
    integration: { ...integration, status: 'operator_review' },
    instruction: 'dry run',
  });

  assert.equal(plan.status, 'review_required');
  assert.equal(plan.dryRunInvocationAllowed, false);
  assert.ok(plan.reviewItems.includes('runtime_dry_run.integration_review_required'));
}

function testMissingInstructionBlocks(): void {
  const plan = planRuntimeDryRunAdapter({ integration, instruction: '   ' });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('runtime_dry_run.instruction_required'));
}

function testWriteCapableIntegrationBlocksThisAdapter(): void {
  const plan = planRuntimeDryRunAdapter({
    integration: { ...integration, runtimeDispatchAllowed: true, mode: 'operator_approved_write' },
    instruction: 'dry run',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('runtime_dry_run.write_capable_integration_requires_separate_runtime_contract'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify(integration);
  planRuntimeDryRunAdapter({ integration, instruction: 'dry run' });
  assert.equal(JSON.stringify(integration), before);
}

testReadyDryRunPlan();
testBlockedIntegrationBlocks();
testReviewIntegrationRequiresReview();
testMissingInstructionBlocks();
testWriteCapableIntegrationBlocksThisAdapter();
testDoesNotMutateInputs();

console.log('runtimeDryRunAdapterContract tests passed');
