#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { listProviders, routeForRole } = require('./model-pool.cjs');

const providers = listProviders();
assert.deepStrictEqual(providers.map((item) => item.provider).sort(), ['claude', 'gemini', 'glm', 'gpt', 'kimi']);

for (const role of ['scout', 'worker', 'judge', 'maya']) {
  const route = routeForRole(role);
  assert.strictEqual(route.role, role);
  assert.strictEqual(route.execution, 'route_only_no_api_call');
  assert(route.selected);
  assert(route.candidates.length >= 3);
}

assert.strictEqual(routeForRole('worker', { capability: 'code' }).selected, 'gpt');
assert.strictEqual(routeForRole('scout', { capability: 'long_context' }).selected, 'kimi');
assert.throws(() => routeForRole('unknown'), /Unknown role/);

console.log('model pool fixtures: PASS');
