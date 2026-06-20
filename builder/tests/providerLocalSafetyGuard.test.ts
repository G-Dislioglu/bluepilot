import assert from 'node:assert/strict';
import test from 'node:test';

import { resetMayaBuilderGateClientForTests, setMayaBuilderGateFetchForTests } from '../src/mayaBuilderGateClient.js';
import {
  LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV,
  LOCAL_EMERGENCY_STOP_ENV,
  resetLocalSafetyGuardForTests,
} from '../src/localSafetyGuard.js';
import { callProvider } from '../src/providers.js';

async function assertCallProviderBlockedBeforeRemote(envKey: string, envValue: string, pattern: RegExp): Promise<void> {
  const previous = process.env[envKey];
  let gateCalled = false;

  try {
    process.env[envKey] = envValue;
    setMayaBuilderGateFetchForTests(async () => {
      gateCalled = true;
      throw new Error('must not call maya gate');
    });

    await assert.rejects(
      () => callProvider('gemini', 'gemini-2.5-flash', {
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        maxTokens: 20,
      }),
      pattern,
    );
    assert.equal(gateCalled, false);
  } finally {
    resetMayaBuilderGateClientForTests();
    resetLocalSafetyGuardForTests();
    if (previous === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = previous;
    }
  }
}

test('provider calls obey local emergency stop before Maya budget gate', async () => {
  await assertCallProviderBlockedBeforeRemote(
    LOCAL_EMERGENCY_STOP_ENV,
    'true',
    /bluepilot_local_safety_blocked:local_emergency_stop/,
  );
});

test('provider calls obey local daily provider token cap before Maya budget gate', async () => {
  await assertCallProviderBlockedBeforeRemote(
    LOCAL_DAILY_PROVIDER_TOKEN_LIMIT_ENV,
    '5',
    /bluepilot_local_safety_blocked:local_daily_provider_token_cap/,
  );
});
