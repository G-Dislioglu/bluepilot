import assert from 'node:assert/strict';
import test from 'node:test';

const waveThreeModules = [
  '../src/providers.js',
  '../src/premiumModelGate.js',
  '../src/outboundHttp.js',
  '../src/pushResultWaiter.js',
  '../src/opusAssist.js',
  '../src/opusSmartPush.js',
  '../src/opusPatchMode.js',
  '../src/opusErrorLearning.js',
  '../src/mayaBuilderGateClient.js'
] as const;

test('migration wave 3 modules import in Bluepilot', async () => {
  for (const modulePath of waveThreeModules) {
    const loaded = await import(modulePath);
    assert.equal(typeof loaded, 'object', `${modulePath} should load`);
  }
});
