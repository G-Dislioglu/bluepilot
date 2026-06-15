import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('BPK governance manifest deduplicates commands and exposes generated schemas', () => {
  const manifest = JSON.parse(readFileSync('data/bpk-governance-manifest.json', 'utf8')) as {
    manifestVersion: number;
    sourceContracts: Array<{ taskId: string }>;
    commandManifest: Array<{ command: string; taskIds: string[] }>;
    schemas: Record<string, { required?: string[]; properties?: Record<string, unknown> }>;
  };

  assert.equal(manifest.manifestVersion, 1);
  assert.deepEqual(manifest.sourceContracts.map((contract) => contract.taskId), [
    'BPK-003',
    'BPK-004',
    'BPK-005',
    'BPK-006',
  ]);

  const typecheckCommand = manifest.commandManifest.find((entry) => entry.command === 'npm run typecheck');
  assert.ok(typecheckCommand);
  assert.deepEqual(typecheckCommand.taskIds, ['BPK-003', 'BPK-004', 'BPK-005', 'BPK-006']);

  const verifyCommands = manifest.commandManifest.filter((entry) => entry.command.includes('verify-task-lock.cjs'));
  assert.equal(verifyCommands.length, 4);

  assert.ok(manifest.schemas.workerPacketWlpDraft);
  assert.ok(manifest.schemas.cardConditionedDispatchPlan);
  assert.ok(manifest.schemas.preRegisteredClaimsGate);
  assert.ok(manifest.schemas.workerPacketWlpDraft.required?.includes('allowed_files'));
  assert.ok(manifest.schemas.cardConditionedDispatchPlan.required?.includes('decision'));
  assert.ok(manifest.schemas.preRegisteredClaimsGate.required?.includes('registeredClaims'));
});

test('BPK governance manifest generator check mode is green', () => {
  const output = execFileSync('node', ['scripts/generate-bpk-governance-manifest.mjs', '--check'], {
    encoding: 'utf8',
  });

  assert.match(output, /bpk governance manifest ok: 4 contracts/);
});
