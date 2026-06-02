import assert from 'node:assert/strict';

import { putFileContent } from '../src/opusPatchMode.js';

function jsonResponse(status: number, body: unknown, statusText = ''): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  });
}

async function testPutFileContentCreatesWithoutSha(): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = (async (url, init) => {
    calls.push({ url: String(url), init });
    if (!init?.method) {
      return jsonResponse(404, { message: 'Not Found' }, 'Not Found');
    }
    return jsonResponse(201, { commit: { sha: 'create-commit' } }, 'Created');
  }) as typeof fetch;

  const result = await putFileContent(
    'G-Dislioglu',
    'bluepilot-sandbox',
    '.bluepilot/new-file.md',
    'hello',
    'create file',
    'test-token',
    fetchImpl as never,
  );

  assert.equal(result.success, true);
  assert.equal(result.commitSha, 'create-commit');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.github.com/repos/G-Dislioglu/bluepilot-sandbox/contents/.bluepilot/new-file.md');
  assert.equal(calls[1].init?.method, 'PUT');

  const putBody = JSON.parse(String(calls[1].init?.body)) as { content: string; sha?: string };
  assert.equal(putBody.content, Buffer.from('hello').toString('base64'));
  assert.equal('sha' in putBody, false);
  assert.equal(JSON.stringify(result).includes('test-token'), false);
}

async function testPutFileContentUpdatesWithSha(): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = (async (url, init) => {
    calls.push({ url: String(url), init });
    if (!init?.method) {
      return jsonResponse(200, { sha: 'existing-sha', content: Buffer.from('old').toString('base64') });
    }
    return jsonResponse(200, { commit: { sha: 'update-commit' } });
  }) as typeof fetch;

  const result = await putFileContent(
    'G-Dislioglu',
    'bluepilot-sandbox',
    '.bluepilot/existing.md',
    'updated',
    'update file',
    'test-token',
    fetchImpl as never,
  );

  assert.equal(result.success, true);
  assert.equal(result.commitSha, 'update-commit');

  const putBody = JSON.parse(String(calls[1].init?.body)) as { content: string; sha?: string };
  assert.equal(putBody.content, Buffer.from('updated').toString('base64'));
  assert.equal(putBody.sha, 'existing-sha');
  assert.equal(JSON.stringify(result).includes('test-token'), false);
}

async function testPutFileContentCreateOnlySkipsInspectAndOmitsSha(): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = (async (url, init) => {
    calls.push({ url: String(url), init });
    return jsonResponse(201, { commit: { sha: 'create-only-commit' } }, 'Created');
  }) as typeof fetch;

  const result = await putFileContent(
    'G-Dislioglu',
    'bluepilot-sandbox',
    '.bluepilot/create-only.md',
    'hello',
    'create only',
    'test-token',
    fetchImpl as never,
    { op: 'create' },
  );

  assert.equal(result.success, true);
  assert.equal(result.commitSha, 'create-only-commit');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, 'PUT');

  const putBody = JSON.parse(String(calls[0].init?.body)) as { content: string; sha?: string };
  assert.equal(putBody.content, Buffer.from('hello').toString('base64'));
  assert.equal('sha' in putBody, false);
}

async function testPutFileContentUpdateOnlyUsesExpectedShaWithoutInspect(): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = (async (url, init) => {
    calls.push({ url: String(url), init });
    return jsonResponse(200, { commit: { sha: 'update-only-commit' } });
  }) as typeof fetch;

  const result = await putFileContent(
    'G-Dislioglu',
    'bluepilot-sandbox',
    '.bluepilot/update-only.md',
    'updated',
    'update only',
    'test-token',
    fetchImpl as never,
    { op: 'update', expectedBaseSha: 'expected-base-sha' },
  );

  assert.equal(result.success, true);
  assert.equal(result.commitSha, 'update-only-commit');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, 'PUT');

  const putBody = JSON.parse(String(calls[0].init?.body)) as { content: string; sha?: string };
  assert.equal(putBody.content, Buffer.from('updated').toString('base64'));
  assert.equal(putBody.sha, 'expected-base-sha');
}

await testPutFileContentCreatesWithoutSha();
await testPutFileContentUpdatesWithSha();
await testPutFileContentCreateOnlySkipsInspectAndOmitsSha();
await testPutFileContentUpdateOnlyUsesExpectedShaWithoutInspect();

console.log('opusPatchMode tests passed');
