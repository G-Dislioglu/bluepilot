import assert from 'node:assert/strict';

import { resolveBuilderTargetProfile } from '../src/builderTargetProfiles.js';
import { buildAdaptiveScopeProposal } from '../src/opusTaskOrchestrator.js';

const resolved = resolveBuilderTargetProfile('goat-desktop', true);
assert.ok(resolved);

const proposal = await buildAdaptiveScopeProposal({
  targetProfile: resolved.profile,
  instruction: 'Plane den GOAT Desktop Einstieg in src/main.ts und src/App.tsx als dry-run.',
});

assert.equal(proposal.kind, 'missing_explicit_scope');
assert.equal(proposal.targetProfileId, 'goat-desktop');
assert.equal(proposal.mayRunWorkers, false);
assert.equal(proposal.dryRunOnly, true);
assert.equal(proposal.continuationPayload.targetProfileId, 'goat-desktop');
assert.equal(proposal.continuationPayload.dryRun, true);
assert.ok(proposal.requiredInput.includes('targetProfileId'));
assert.ok(proposal.requiredInput.includes('scope[] or targetFile'));
assert.deepEqual(proposal.continuationPayload.scope, ['src/main.ts', 'src/App.tsx']);
assert.equal(proposal.proposedScope[0]?.confidence, 'high');

console.log(JSON.stringify({
  ok: true,
  targetProfileId: proposal.targetProfileId,
  proposedScope: proposal.proposedScope.map((candidate) => candidate.path),
}, null, 2));
