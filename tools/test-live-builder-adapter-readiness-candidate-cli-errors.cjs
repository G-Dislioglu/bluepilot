#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function run(args) {
  return spawnSync(process.execPath, ['tools/live-builder-adapter-readiness-candidate.cjs', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

const missingInput = run([]);
assert.equal(missingInput.status, 1, 'missing input exits 1');
assert.match(missingInput.stderr, /Usage: node tools\/live-builder-adapter-readiness-candidate\.cjs --input <path> \[--pretty\]/, 'missing input prints usage');
assert.equal(missingInput.stdout, '', 'missing input has no stdout');

const unreadableInput = run(['--input', 'examples/live-builder-adapter-readiness-candidate/NO_SUCH_FILE.input.json']);
assert.equal(unreadableInput.status, 1, 'unreadable input exits 1');
assert.match(unreadableInput.stderr, /Input konnte nicht gelesen werden:/, 'unreadable input reports read failure');
assert.match(unreadableInput.stderr, /Usage: node tools\/live-builder-adapter-readiness-candidate\.cjs --input <path> \[--pretty\]/, 'unreadable input prints usage');
assert.equal(unreadableInput.stdout, '', 'unreadable input has no stdout');

process.stdout.write('live builder adapter readiness candidate CLI errors: PASS\n');
