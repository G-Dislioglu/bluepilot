#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getMemory, listMemory, memoryPath, setMemory } = require('./maya-memory.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-maya-memory-'));

assert.strictEqual(getMemory(root, 'project_name'), null);
const project = setMemory(root, 'project_name', 'Bluepilot');
assert.strictEqual(project.value, 'Bluepilot');
assert.strictEqual(project.proposal_only, true);
assert(fs.existsSync(memoryPath(root)));

const models = setMemory(root, 'preferred_models', { worker: 'gpt', judge: 'claude' }, { proposalOnly: false, source: 'test' });
assert.strictEqual(models.proposal_only, false);
assert.strictEqual(getMemory(root, 'preferred_models').value.judge, 'claude');

const listed = listMemory(root);
assert.strictEqual(listed.entries.length, 2);
assert.throws(() => setMemory(root, 'affective_state', 'nope'), /Unsupported memory key/);

console.log('maya memory fixtures: PASS');
