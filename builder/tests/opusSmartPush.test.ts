import assert from 'node:assert/strict';

import { buildPatchViaPushFiles, smartPush } from '../src/opusSmartPush.js';
import type { PatchEdit } from '../src/opusPatchMode.js';

function testSmallFilesStayDeterministicOverwrite(): void {
  const patches: PatchEdit[] = [
    {
      search: 'alpha\n',
      replace: 'alpha\nbeta\n',
    },
  ];

  const files = buildPatchViaPushFiles('docs/archive/push-test.md', patches, 'alpha\nbeta\n');
  assert.deepEqual(files, [
    {
      file: 'docs/archive/push-test.md',
      content: 'alpha\nbeta\n',
    },
  ]);
}

function testLargeFilesFallBackToSearchReplacePayloads(): void {
  const patches: PatchEdit[] = [
    {
      search: 'const current = body.question;\n',
      replace: "const question = typeof body.question === 'string' ? body.question.trim() : '';\n",
    },
  ];

  const largeContent = `${'x'.repeat(60_000)}\n${patches[0].replace}`;
  const files = buildPatchViaPushFiles('server/src/routes/studio.ts', patches, largeContent);
  assert.deepEqual(files, [
    {
      file: 'server/src/routes/studio.ts',
      search: 'const current = body.question;\n',
      replace: "const question = typeof body.question === 'string' ? body.question.trim() : '';\n",
    },
  ]);
}

testSmallFilesStayDeterministicOverwrite();
testLargeFilesFallBackToSearchReplacePayloads();

const allowCorridor = async () => ({
  allowed: true,
  reason: 'approved_irreversible_action',
  gateAvailable: true,
});

async function withGitHubToken<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'test-token';
  try {
    return await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previous;
    }
  }
}

async function withoutGitHubToken<T>(fn: () => Promise<T>): Promise<T> {
  const previousGithub = process.env.GITHUB_TOKEN;
  const previousGh = process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GH_TOKEN;
  try {
    return await fn();
  } finally {
    if (previousGithub === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previousGithub;
    }
    if (previousGh === undefined) {
      delete process.env.GH_TOKEN;
    } else {
      process.env.GH_TOKEN = previousGh;
    }
  }
}

async function testProvidedTargetRepoReachesDirectPatch(): Promise<void> {
  await withGitHubToken(async () => {
    let captured: unknown[] = [];

    const result = await smartPush(
      [{
        file: 'README.md',
        mode: 'patch',
        patches: [{ search: 'old', replace: 'new' }],
      }],
      'test sandbox target',
      {
        targetRepo: 'G-Dislioglu/bluepilot-sandbox',
        assessCorridorImpl: allowCorridor,
        applyPatchImpl: async (...args) => {
          captured = args;
          return { success: true, commitSha: 'commit-sandbox' };
        },
      },
    );

    assert.equal(result.pushed, true);
    assert.ok(captured.length > 0);
    assert.deepEqual(captured.slice(0, 3), ['G-Dislioglu', 'bluepilot-sandbox', 'README.md']);
  });
}

async function testDefaultTargetRepoStaysSoulmatch(): Promise<void> {
  await withGitHubToken(async () => {
    let captured: unknown[] = [];

    const result = await smartPush(
      [{
        file: 'README.md',
        mode: 'patch',
        patches: [{ search: 'old', replace: 'new' }],
      }],
      'test default target',
      {
        assessCorridorImpl: allowCorridor,
        applyPatchImpl: async (...args) => {
          captured = args;
          return { success: true, commitSha: 'commit-default' };
        },
      },
    );

    assert.equal(result.pushed, true);
    assert.ok(captured.length > 0);
    assert.deepEqual(captured.slice(0, 3), ['G-Dislioglu', 'soulmatch', 'README.md']);
  });
}

async function testMalformedTargetRepoFailsBeforeGateOrWrite(): Promise<void> {
  let corridorCalled = false;
  let patchCalled = false;

  await assert.rejects(
    () => smartPush(
      [{
        file: 'README.md',
        mode: 'patch',
        patches: [{ search: 'old', replace: 'new' }],
      }],
      'test malformed target',
      {
        targetRepo: 'not/a/valid/repo',
        assessCorridorImpl: async () => {
          corridorCalled = true;
          return allowCorridor();
        },
        applyPatchImpl: async () => {
          patchCalled = true;
          return { success: true };
        },
      },
    ),
    /invalid targetRepo/,
  );

  assert.equal(corridorCalled, false);
  assert.equal(patchCalled, false);
}

async function testRawFallbackReadsFromProvidedTargetRepo(): Promise<void> {
  await withoutGitHubToken(async () => {
    let rawUrl = '';
    const fakeRawFetch = async (input: unknown) => {
      rawUrl = String(input);
      return {
        ok: true,
        text: async () => 'alpha',
      };
    };

    const result = await smartPush(
      [{
        file: '.bluepilot/nonexistent-target-aware-test.md',
        mode: 'patch',
        patches: [{ search: 'alpha', replace: 'beta' }],
      }],
      'test raw fallback target',
      {
        targetRepo: 'G-Dislioglu/bluepilot-sandbox',
        assessCorridorImpl: allowCorridor,
        outboundFetchImpl: fakeRawFetch as never,
      },
    );

    assert.equal(result.pushed, false);
    assert.match(result.error ?? '', /patch-via-push unsupported for non-default target/);
    assert.equal(
      rawUrl,
      'https://raw.githubusercontent.com/G-Dislioglu/bluepilot-sandbox/main/.bluepilot/nonexistent-target-aware-test.md',
    );
  });
}

async function testNonDefaultOverwriteUsesDirectWholeFileWrite(): Promise<void> {
  await withGitHubToken(async () => {
    let captured: unknown[] = [];

    const result = await smartPush(
      [{
        file: '.bluepilot/phase-b-real-write.md',
        mode: 'create',
        content: 'sandbox marker',
      }],
      'test non-default overwrite',
      {
        targetRepo: 'G-Dislioglu/bluepilot-sandbox',
        assessCorridorImpl: allowCorridor,
        putFileContentImpl: async (...args) => {
          captured = args;
          return { success: true, commitSha: 'sandbox-write-commit' };
        },
      },
    );

    assert.equal(result.pushed, true);
    assert.equal(result.asyncDispatch, false);
    assert.equal(result.landed, true);
    assert.equal(result.commitHash, 'sandbox-write-commit');
    assert.deepEqual(captured.slice(0, 5), [
      'G-Dislioglu',
      'bluepilot-sandbox',
      '.bluepilot/phase-b-real-write.md',
      'sandbox marker',
      'test non-default overwrite',
    ]);
    assert.equal(result.error?.includes('unsupported'), undefined);
  });
}

async function testNonDefaultOverwriteRequiresGitHubToken(): Promise<void> {
  await withoutGitHubToken(async () => {
    let putCalled = false;

    const result = await smartPush(
      [{
        file: '.bluepilot/phase-b-real-write.md',
        mode: 'create',
        content: 'sandbox marker',
      }],
      'test missing token',
      {
        targetRepo: 'G-Dislioglu/bluepilot-sandbox',
        assessCorridorImpl: allowCorridor,
        putFileContentImpl: async () => {
          putCalled = true;
          return { success: true, commitSha: 'should-not-happen' };
        },
      },
    );

    assert.equal(result.pushed, false);
    assert.equal(putCalled, false);
    assert.match(result.error ?? '', /requires GitHub token/);
    assert.doesNotMatch(result.error ?? '', /test-token/);
  });
}

async function testDefaultOverwriteStillUsesPushPath(): Promise<void> {
  await withGitHubToken(async () => {
    let putCalled = false;
    let pushUrl = '';

    const fakeFetch = async (input: unknown, init?: RequestInit) => {
      pushUrl = String(input);
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(String(init?.body)) as { files: unknown[]; message: string };
      assert.deepEqual(body.files, [{ file: 'README.md', content: 'default overwrite' }]);
      assert.equal(body.message, 'test default overwrite');
      return {
        json: async () => ({ triggered: false, error: 'mock stops before async wait' }),
      };
    };

    const result = await smartPush(
      [{
        file: 'README.md',
        mode: 'overwrite',
        content: 'default overwrite',
      }],
      'test default overwrite',
      {
        assessCorridorImpl: allowCorridor,
        outboundFetchImpl: fakeFetch as never,
        putFileContentImpl: async () => {
          putCalled = true;
          return { success: true, commitSha: 'should-not-happen' };
        },
      },
    );

    assert.equal(putCalled, false);
    assert.match(pushUrl, /\/push/);
    assert.equal(result.asyncDispatch, true);
    assert.match(result.error ?? '', /overwrite push failed/);
  });
}

await testProvidedTargetRepoReachesDirectPatch();
await testDefaultTargetRepoStaysSoulmatch();
await testMalformedTargetRepoFailsBeforeGateOrWrite();
await testRawFallbackReadsFromProvidedTargetRepo();
await testNonDefaultOverwriteUsesDirectWholeFileWrite();
await testNonDefaultOverwriteRequiresGitHubToken();
await testDefaultOverwriteStillUsesPushPath();

console.log('opusSmartPush tests passed');
