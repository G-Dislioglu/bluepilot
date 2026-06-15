import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRepoCapabilityAuditRequest } from '../src/repoCapabilityAuditRoute.js';
import type { RepoCapabilityAudit } from '../src/repoCapabilityAudit.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleRepoCapabilityAuditRequest(request, response, {
      now: new Date('2026-06-15T12:00:00.000Z'),
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

test('GET /probe/repo-capability-audit exposes read-only cross-repo candidates', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/repo-capability-audit`);
    const body = await response.json() as RepoCapabilityAudit;

    assert.equal(response.status, 200);
    assert.equal(body.generatedAt, '2026-06-15T12:00:00.000Z');
    assert.ok(body.sources.some((source) => source.repo === 'goat-desktop'));
    assert.ok(body.adoptionCandidates.some((candidate) => candidate.id === 'builder_patrol_visual_review'));
    assert.equal(body.sideEffects.fileWrites, false);
    assert.equal(body.sideEffects.deploys, false);
  });
});

test('repo capability audit route rejects non-GET methods', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/repo-capability-audit`, { method: 'POST' });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
  });
});
