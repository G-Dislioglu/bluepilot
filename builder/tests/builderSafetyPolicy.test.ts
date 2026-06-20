import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyBuilderTask } from '../src/builderSafetyPolicy.js';

test('classifyBuilderTask treats main and master as protected live branches', () => {
  for (const targetBranch of ['main', 'master', ' Main ']) {
    const decision = classifyBuilderTask({
      targetFile: '.bluepilot/permit-apply.md',
      targetBranch,
      approvalId: 'approval-1',
      hasApprovedPlan: true,
      allowAutonomousPush: true,
      judgeDecision: 'approve',
    });

    assert.equal(decision.taskClass, 'class_3');
    assert.equal(decision.executionPolicy, 'manual_only');
    assert.equal(decision.decision, 'block');
    assert.equal(decision.pushAllowed, false);
    assert.equal(decision.requiredExternalApproval, true);
    assert.match(decision.approvalReason ?? '', /Protected branch requires manual proof gate/);
  }
});

test('classifyBuilderTask allows a scoped non-protected branch with approval', () => {
  const decision = classifyBuilderTask({
    targetFile: '.bluepilot/permit-apply.md',
    targetBranch: 'feature/permit-apply',
    approvalId: 'approval-1',
    hasApprovedPlan: true,
    allowAutonomousPush: true,
    judgeDecision: 'approve',
  });

  assert.equal(decision.taskClass, 'class_1');
  assert.equal(decision.executionPolicy, 'allow_push');
  assert.equal(decision.decision, 'approve');
  assert.equal(decision.pushAllowed, true);
  assert.equal(decision.requiredExternalApproval, false);
});
