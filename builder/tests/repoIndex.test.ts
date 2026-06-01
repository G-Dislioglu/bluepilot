import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateIndexCache, resolveScope } from '../src/builderScopeResolver.js';

interface RepoIndex {
  totalFiles: number;
  files: Array<{
    path: string;
    lines: number;
    exports: string[];
  }>;
}

function readIndex(): RepoIndex {
  return JSON.parse(readFileSync('data/builder-repo-index.json', 'utf8')) as RepoIndex;
}

test('builder repo index artifact has the target repo shape expected by scope resolver', () => {
  const index = readIndex();

  assert.equal(index.totalFiles, index.files.length);
  assert.ok(index.totalFiles > 0);
  assert.ok(index.files.some((file) => file.path === 'server/src/lib/opusTaskOrchestrator.ts'));
  assert.ok(index.files.some((file) => file.path === 'client/src/app/App.tsx'));

  for (const file of index.files) {
    assert.equal(typeof file.path, 'string');
    assert.equal(typeof file.lines, 'number');
    assert.ok(Array.isArray(file.exports));
    assert.equal(file.path.includes('\\'), false);
  }
});

test('repo index generator check confirms the committed artifact is normalized', () => {
  const output = execFileSync('node', ['scripts/generate-repo-index.mjs', '--check'], {
    encoding: 'utf8',
  });

  assert.match(output, /repo index ok:/);
});

test('resolveScope loads the committed artifact and resolves an indexed soulmatch path', () => {
  invalidateIndexCache();

  const result = resolveScope('Refine the dry-run orchestration in server/src/lib/opusTaskOrchestrator.ts');

  assert.ok(result.files.includes('server/src/lib/opusTaskOrchestrator.ts'));
  assert.equal(result.method, 'deterministic');
});
