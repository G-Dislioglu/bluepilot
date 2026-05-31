import assert from 'node:assert/strict';
import test from 'node:test';

const waveOneModules = [
  '../src/builderAnalysisOutput.js',
  '../src/builderRecommendationOutput.js',
  '../src/builderRelatedFiles.js',
  '../src/builderSafetyPolicy.js',
  '../src/builderSideEffects.js',
  '../src/builderTargetProfiles.js',
  '../src/builderWorkflowSimulation.js',
  '../src/opusAnchorPaths.js',
  '../src/opusBridgeConfig.js',
  '../src/opusChangeRouter.js',
  '../src/opusClaimGate.js',
  '../src/opusEnvelopeValidator.js',
  '../src/opusWorkerRegistry.js',
  '../src/specHardening.js'
] as const;

test('migration wave 1 modules import in Bluepilot', async () => {
  for (const modulePath of waveOneModules) {
    const loaded = await import(modulePath);
    assert.equal(typeof loaded, 'object', `${modulePath} should load`);
  }
});
