#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { queryCards, tokenize } = require('./aicos-query.cjs');

const index = [
  {
    id: 'sol-dev-006',
    type: 'solution',
    token: 'worktree_conflict_forecast',
    title: 'Git Worktree Conflict Forecast',
    domain: ['git', 'parallel_execution'],
    tags: ['worktree', 'conflict', 'branch'],
  },
  {
    id: 'sol-cross-058',
    type: 'governance',
    token: 'proposal_only_memory_boundary',
    title: 'Proposal-only Memory Boundary',
    domain: ['memory', 'governance'],
    tags: ['proposal_only', 'memory'],
  },
  {
    id: 'err-api-004',
    type: 'error_pattern',
    token: 'env_block_vs_code_failure',
    title: 'ENV Block Diagnosis',
    domain: ['devserver'],
    tags: ['env', 'diagnosis'],
  },
];

assert.deepStrictEqual(tokenize('BP-C3 worktree conflict task'), ['worktree', 'conflict']);

const worktree = queryCards(index, 'parallel executor worktree conflict', { source: 'fixture' });
assert.strictEqual(worktree.write_mode, 'read_only');
assert.strictEqual(worktree.matches[0].card_id, 'sol-dev-006');
assert(worktree.matches[0].reasons.includes('title:worktree'));

const memory = queryCards(index, 'maya memory proposal only', { source: 'fixture' });
assert.strictEqual(memory.matches[0].card_id, 'sol-cross-058');

const none = queryCards(index, 'visual browser screenshot', { source: 'fixture' });
assert.strictEqual(none.matches.length, 0);

console.log('aicos query fixtures: PASS');
