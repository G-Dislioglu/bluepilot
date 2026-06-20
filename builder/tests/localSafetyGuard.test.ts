import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyBuilderTask } from '../src/builderSafetyPolicy.js';
import {
  LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV,
  LOCAL_EMERGENCY_STOP_ENV,
  applyLocalSafetyToBuilderSafetyDecision,
  assessLocalSafetyGuard,
  recordLocalProviderTokens,
  resetLocalSafetyGuardForTests,
} from '../src/localSafetyGuard.js';

test('local emergency stop blocks every target', () => {
  const env = { [LOCAL_EMERGENCY_STOP_ENV]: 'true' };

  for (const target of ['provider_call', 'write_action', 'runtime_execution'] as const) {
    const decision = assessLocalSafetyGuard({ target, env, now: new Date('2026-06-20T10:00:00.000Z') });

    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'local_emergency_stop');
    assert.equal(decision.dayKey, '2026-06-20');
  }
});

test('local daily provider token cap blocks projected provider calls', () => {
  resetLocalSafetyGuardForTests();

  const now = new Date('2026-06-20T10:00:00.000Z');
  const env = { [LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV]: '100' };
  recordLocalProviderTokens(80, now);

  const blocked = assessLocalSafetyGuard({
    target: 'provider_call',
    requestedProviderTokens: 25,
    env,
    now,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'local_daily_provider_token_cap');

  const allowed = assessLocalSafetyGuard({
    target: 'provider_call',
    requestedProviderTokens: 20,
    env,
    now,
  });
  assert.equal(allowed.allowed, true);

  resetLocalSafetyGuardForTests();
});

test('local safety block can reuse the existing builder safety decision path', () => {
  const base = classifyBuilderTask({
    targetFile: '.bluepilot/permit-apply.md',
    targetBranch: 'feature/safe',
    approvalId: 'approval-1',
    hasApprovedPlan: true,
    allowAutonomousPush: true,
    judgeDecision: 'approve',
  });

  const merged = applyLocalSafetyToBuilderSafetyDecision(base, assessLocalSafetyGuard({
    target: 'write_action',
    env: { [LOCAL_EMERGENCY_STOP_ENV]: '1' },
  }));

  assert.equal(merged.decision, 'block');
  assert.equal(merged.executionPolicy, 'manual_only');
  assert.equal(merged.pushAllowed, false);
  assert.match(merged.reasons.join('\n'), /local_emergency_stop/);
});
