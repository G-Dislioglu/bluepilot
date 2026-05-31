import assert from 'node:assert/strict';
import test from 'node:test';

import { getDb } from '../src/db.js';

test('migration wave 2 database modules import without a live database', async () => {
  const schema = await import('../src/schema/builder.js');
  const poolState = await import('../src/poolState.js');
  const approvalArtifacts = await import('../src/builderApprovalArtifacts.js');
  const tableExports = [
    'builderActions',
    'builderAgentProfiles',
    'builderArtifacts',
    'builderAssumptions',
    'builderChains',
    'builderChatpool',
    'builderErrorCards',
    'builderMemory',
    'builderOpusLog',
    'builderReviews',
    'builderTasks',
    'builderTestResults',
    'builderWorkerScores',
    'poolState',
    'asyncJobs'
  ];

  assert.equal(typeof schema.builderTasks, 'object');
  assert.equal(typeof schema.poolState, 'object');
  assert.equal(tableExports.length, 15);
  for (const tableExport of tableExports) {
    assert.equal(typeof schema[tableExport as keyof typeof schema], 'object');
  }
  assert.equal(typeof poolState.getActivePools, 'function');
  assert.equal(typeof poolState.initializePoolState, 'function');
  assert.equal(typeof approvalArtifacts.validateApprovalArtifact, 'function');
});

test('getDb fails clearly when BLUEPILOT_BUILDER_DATABASE_URL is missing', () => {
  const previous = process.env.BLUEPILOT_BUILDER_DATABASE_URL;
  delete process.env.BLUEPILOT_BUILDER_DATABASE_URL;

  try {
    assert.throws(
      () => getDb(),
      /BLUEPILOT_BUILDER_DATABASE_URL is required for Bluepilot Builder database operations/,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.BLUEPILOT_BUILDER_DATABASE_URL;
    } else {
      process.env.BLUEPILOT_BUILDER_DATABASE_URL = previous;
    }
  }
});
