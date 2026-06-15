import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMergeReleaseReadinessRequest } from '../src/mergeReleaseReadinessRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleMergeReleaseReadinessRequest(request, response, {
      now: new Date('2026-06-15T18:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test('GET /probe/merge-release-readiness-contract exposes closed release boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/merge-release-readiness-contract`);
    const body = await response.json() as {
      version: string;
      activationBoundary: { createsPullRequests: boolean; mergesBranches: boolean; deploysRelease: boolean };
      sideEffects: { githubWrites: boolean; merges: boolean; deploys: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-merge-release-readiness-preflight-contract-v0.1');
    assert.equal(body.activationBoundary.createsPullRequests, false);
    assert.equal(body.activationBoundary.mergesBranches, false);
    assert.equal(body.activationBoundary.deploysRelease, false);
    assert.equal(body.sideEffects.githubWrites, false);
    assert.equal(body.sideEffects.merges, false);
    assert.equal(body.sideEffects.deploys, false);
  });
});

test('POST /probe/merge-release-readiness-preflight validates PR sequence without GitHub writes', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/merge-release-readiness-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        releaseLabel: 'integration-stack',
        candidates: [{
          taskId: 'BPK-227',
          branch: 'bluepilot-provider-runtime-activation-preflight',
          commit: 'f5f524f',
          status: 'verified',
          title: 'Provider Runtime Preflight',
          summary: 'Provider/runtime activation preflight is wired contract-only.',
          checks: [{ name: 'builder', status: 'pass' }],
        }],
      }),
    });
    const body = await response.json() as {
      status: string;
      applicationActions: { pullRequestCreationAllowed: boolean; mergeExecutionAllowed: boolean };
      sideEffects: { githubWrites: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_pr_sequence_review');
    assert.equal(body.applicationActions.pullRequestCreationAllowed, false);
    assert.equal(body.applicationActions.mergeExecutionAllowed, false);
    assert.equal(body.sideEffects.githubWrites, false);
  });
});

test('merge release readiness routes reject wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/merge-release-readiness-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/merge-release-readiness-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
