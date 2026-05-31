#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getMemory, listMemory, memoryPath, setMemory } = require('./maya-memory.cjs');
const { resetFetchForTests, setFetchForTests } = require('./maya-memory-remote-client.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-maya-memory-'));

async function run() {
  const originalMayaCoreUrl = process.env.MAYA_CORE_URL;
  const originalGateToken = process.env.MAYA_CORE_GATE_TOKEN;

  try {
    process.env.MAYA_CORE_URL = 'https://maya-core.example';
    process.env.MAYA_CORE_GATE_TOKEN = 'test-token';

    let proposedBody = null;
    setFetchForTests(async (url, init = {}) => {
      if (String(url).endsWith('/api/maya/memory') && init.method === 'POST') {
        proposedBody = JSON.parse(init.body);
        assert.strictEqual(proposedBody.appOrigin, 'bluepilot');
        assert.strictEqual(proposedBody.app_origin, 'bluepilot');
        assert.strictEqual(proposedBody.reviewStatus, 'pending');
        assert.strictEqual(proposedBody.review_status, 'pending');
        assert.strictEqual(init.headers['x-maya-core-gate-token'], 'test-token');
        return new Response(JSON.stringify({
          entry: {
            id: 'mem-1',
            appOrigin: 'bluepilot',
            reviewStatus: 'pending',
            updatedAt: '2026-05-31T00:00:00.000Z',
            content: proposedBody.content,
            metaJson: proposedBody.metaJson,
          },
        }), { status: 200 });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const project = await setMemory(root, 'project_name', 'Bluepilot');
    assert.strictEqual(project.value, 'Bluepilot');
    assert.strictEqual(project.proposal_only, true);
    assert.strictEqual(project.storage, 'shared_block2');
    assert.strictEqual(project.offline, false);
    assert(!fs.existsSync(memoryPath(root)), 'remote success should not write local fallback');

    setFetchForTests(async (url) => {
      assert(String(url).includes('/api/maya/memory?'));
      return new Response(JSON.stringify({
        entries: [
          {
            id: 'mem-confirmed',
            appOrigin: 'bluepilot',
            reviewStatus: 'confirmed',
            updatedAt: '2026-05-31T00:01:00.000Z',
            content: JSON.stringify({ key: 'preferred_models', value: { worker: 'gpt', judge: 'claude' } }),
            metaJson: JSON.stringify({
              bluepilot_key: 'preferred_models',
              bluepilot_value: { worker: 'gpt', judge: 'claude' },
            }),
          },
          {
            id: 'mem-pending',
            appOrigin: 'bluepilot',
            reviewStatus: 'pending',
            updatedAt: '2026-05-31T00:02:00.000Z',
            content: JSON.stringify({ key: 'project_name', value: 'Pending Name' }),
            metaJson: JSON.stringify({
              bluepilot_key: 'project_name',
              bluepilot_value: 'Pending Name',
            }),
          },
        ],
      }), { status: 200 });
    });

    const models = await getMemory(root, 'preferred_models');
    assert.strictEqual(models.value.judge, 'claude');
    assert.strictEqual(models.proposal_only, false);
    const listedRemote = await listMemory(root);
    assert.strictEqual(listedRemote.storage, 'shared_block2');
    assert.strictEqual(listedRemote.entries.length, 1);
    assert.strictEqual(listedRemote.entries[0].key, 'preferred_models');

    delete process.env.MAYA_CORE_URL;
    resetFetchForTests();

    assert.strictEqual(await getMemory(root, 'project_name'), null);
    const localProject = await setMemory(root, 'project_name', 'Offline Bluepilot', { source: 'test' });
    assert.strictEqual(localProject.value, 'Offline Bluepilot');
    assert.strictEqual(localProject.proposal_only, true);
    assert.strictEqual(localProject.offline, true);
    assert.strictEqual(localProject.storage, 'local_json_fallback');
    assert(fs.existsSync(memoryPath(root)));

    const localRead = await getMemory(root, 'project_name');
    assert.strictEqual(localRead.value, 'Offline Bluepilot');
    assert.strictEqual(localRead.offline, true);

    const listedLocal = await listMemory(root);
    assert.strictEqual(listedLocal.offline, true);
    assert.strictEqual(listedLocal.entries.length, 1);

    await assert.rejects(() => setMemory(root, 'affective_state', 'nope'), /Unsupported memory key/);

    console.log('maya memory fixtures: PASS');
  } finally {
    resetFetchForTests();
    if (originalMayaCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = originalMayaCoreUrl;
    }
    if (originalGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = originalGateToken;
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
