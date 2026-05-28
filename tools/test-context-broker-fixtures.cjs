#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { isBlockedPath, readTextFile, sessionStart } = require('./context-broker.cjs');

assert.strictEqual(isBlockedPath('.env'), true);
assert.strictEqual(isBlockedPath('.env.local'), true);
assert.strictEqual(isBlockedPath('node_modules/pkg/index.js'), true);
assert.strictEqual(isBlockedPath('../outside.md'), true);
assert.strictEqual(isBlockedPath('AGENTS.md'), false);

const blocked = readTextFile(process.cwd(), '.env');
assert.strictEqual(blocked.status, 'blocked');

const context = sessionStart(process.cwd(), 'BP-092', { include: ['AGENTS.md', '.env.local'] });
assert.strictEqual(context.task_id, 'BP-092');
assert.strictEqual(context.contract.task_id, 'BP-092');
assert(context.summary.loaded.includes('AGENTS.md'));
assert(context.summary.loaded.includes('.specify/.app-goal.md'));
assert(context.summary.blocked.some((item) => item.path === '.env.local'));
assert(context.files.some((file) => file.path === 'contracts/BP-092.json' && file.status === 'loaded'));

console.log('context broker fixtures: PASS');
