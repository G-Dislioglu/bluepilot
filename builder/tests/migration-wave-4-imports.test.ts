import assert from 'node:assert/strict';
import test from 'node:test';

const waveFourModules = [
  '../src/opusTaskOrchestrator.js',
  '../src/opusBuildPipeline.js',
  '../src/architectPhase1.js',
  '../src/opusJudge.js',
  '../src/opusRenderBridge.js',
  '../src/opusSelfTest.js',
  '../src/builderScopeResolver.js',
  '../src/builderControlPlane.js',
  '../src/devLogger.js'
] as const;

test('migration wave 4 orchestrator tip modules import in Bluepilot', async () => {
  for (const modulePath of waveFourModules) {
    const loaded = await import(modulePath);
    assert.equal(typeof loaded, 'object', `${modulePath} should load`);
  }
});
