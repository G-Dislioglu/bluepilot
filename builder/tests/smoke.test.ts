import assert from 'node:assert/strict';
import test from 'node:test';

import { describeBuilderHome } from '../src/smoke.js';

test('Bluepilot Builder TypeScript home runs through tsx', () => {
  assert.deepEqual(describeBuilderHome(), {
    packageName: '@bluepilot/builder',
    runtime: 'typescript-esm',
    readyForMigration: true
  });
});
