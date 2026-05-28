#!/usr/bin/env node

'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createServer, HOST, ROUTE } = require('./mock-builder-adapter-http-server.cjs');

const repoRoot = path.resolve(__dirname, '..');

const fixtures = [
  ['BP-007 allow', 'examples/builder-adapter/BP-007.allow.input.json', 'examples/builder-adapter/BP-007.allow.output.json'],
  ['BP-007 reject', 'examples/builder-adapter/BP-007.reject.input.json', 'examples/builder-adapter/BP-007.reject.output.json'],
  ['BP-007 pending human review', 'examples/builder-adapter/BP-007.human-review.input.json', 'examples/builder-adapter/BP-007.human-review.output.json'],
  ['BP-008 scope violation', 'examples/builder-adapter/BP-008.scope-violation.input.json', 'examples/builder-adapter/BP-008.scope-violation.output.json'],
  ['BP-008 blocked operation', 'examples/builder-adapter/BP-008.blocked-operation.input.json', 'examples/builder-adapter/BP-008.blocked-operation.output.json'],
  ['BP-009 approved human review', 'examples/builder-adapter/BP-009.human-review-approved.input.json', 'examples/builder-adapter/BP-009.human-review-approved.output.json'],
];

function readRepoFile(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf-8').replace(/\r\n/g, '\n').trimEnd();
}

function request(port, options) {
  return new Promise((resolve, reject) => {
    const body = options.body || '';
    const req = http.request({
      host: HOST,
      port,
      path: options.path || ROUTE,
      method: options.method || 'POST',
      headers: {
        'content-type': options.contentType || 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', reject);
    req.end(body);
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertMockBlocked(label, response, expectedStatusCode, expectedReason) {
  if (response.statusCode !== expectedStatusCode) {
    fail(`${label}: expected HTTP ${expectedStatusCode}, got ${response.statusCode}.`);
  }
  const parsed = JSON.parse(response.body);
  if (parsed.mock !== true) fail(`${label}: expected mock=true.`);
  if (parsed.status !== 'blocked') fail(`${label}: expected status=blocked.`);
  if (parsed.decision_ready !== false) fail(`${label}: expected decision_ready=false.`);
  if (!Array.isArray(parsed.blocked_reasons) || !parsed.blocked_reasons.includes(expectedReason)) {
    fail(`${label}: expected blocked reason "${expectedReason}".`);
  }
}

async function run() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, HOST, resolve));
  const port = server.address().port;

  try {
    for (const [name, inputPath, outputPath] of fixtures) {
      const response = await request(port, { body: readRepoFile(inputPath) });
      if (response.statusCode !== 200) fail(`${name}: expected HTTP 200, got ${response.statusCode}.`);
      const expected = readRepoFile(outputPath);
      const actual = JSON.stringify(JSON.parse(response.body), null, 2);
      if (actual !== expected) fail(`${name}: HTTP response differs from fixture output.`);
      console.log(`${name}: PASS`);
    }

    assertMockBlocked('non-POST', await request(port, { method: 'GET' }), 405, 'method must be POST');
    console.log('non-POST: PASS');

    assertMockBlocked('non-JSON', await request(port, { contentType: 'text/plain', body: '{}' }), 415, 'content-type must be application/json');
    console.log('non-JSON: PASS');

    assertMockBlocked('invalid JSON', await request(port, { body: '{not-json' }), 200, 'invalid JSON');
    console.log('invalid JSON: PASS');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => fail(err.message));
