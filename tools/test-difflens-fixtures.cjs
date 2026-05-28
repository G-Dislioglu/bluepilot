#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { parseUnifiedDiff, normalizeDiffPath } = require('./difflens.cjs');

assert.strictEqual(normalizeDiffPath('a/tools/example.cjs'), 'tools/example.cjs');
assert.strictEqual(normalizeDiffPath('b/app/page.tsx'), 'app/page.tsx');

const diff = [
  'diff --git a/tools/example.cjs b/tools/example.cjs',
  'index 1111111..2222222 100644',
  '--- a/tools/example.cjs',
  '+++ b/tools/example.cjs',
  '@@ -1,3 +1,4 @@',
  ' const ok = true;',
  '-const oldValue = 1;',
  '+const newValue = 2;',
  '+const added = true;',
  'diff --git a/package-lock.json b/package-lock.json',
  'index 3333333..4444444 100644',
  '--- a/package-lock.json',
  '+++ b/package-lock.json',
  '@@ -10,2 +10,2 @@',
  '-    "left-pad": "1.0.0"',
  '+    "left-pad": "1.1.0"',
  'diff --git a/assets/logo.png b/assets/logo.png',
  'Binary files a/assets/logo.png and b/assets/logo.png differ',
  'diff --git a/.env.example b/.env.example',
  '--- a/.env.example',
  '+++ b/.env.example',
  '@@ -1 +1 @@',
  '-TOKEN=old',
  '+TOKEN=new',
].join('\n');

const result = parseUnifiedDiff(diff);

assert.strictEqual(result.tool, 'difflens');
assert.strictEqual(result.summary.files, 4);
assert.strictEqual(result.summary.hunks, 3);
assert.strictEqual(result.summary.additions, 4);
assert.strictEqual(result.summary.deletions, 3);
assert.strictEqual(result.summary.binary_files, 1);
assert.strictEqual(result.human_gate_required, true);
assert.strictEqual(result.visual_review_required, true);

const example = result.files.find((file) => file.file_path === 'tools/example.cjs');
assert(example);
assert.strictEqual(example.hunks, 1);
assert.strictEqual(example.additions, 2);
assert.strictEqual(example.deletions, 1);
assert(example.flags.includes('runtime_path'));

const flagCodes = result.risk_flags.map((flag) => flag.code);
assert(flagCodes.includes('runtime_path'));
assert(flagCodes.includes('lockfile_diff'));
assert(flagCodes.includes('binary_diff'));
assert(flagCodes.includes('sensitive_path'));

const empty = parseUnifiedDiff('');
assert.strictEqual(empty.summary.files, 0);
assert.strictEqual(empty.human_gate_required, false);
assert.strictEqual(empty.visual_review_required, false);

console.log('difflens fixtures: PASS');
