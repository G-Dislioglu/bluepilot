#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getCouncilPaths,
  readJson,
  registerAgent,
  reportDone,
  reportStarted,
} = require('./council-agent-client.cjs');
const {
  createSession,
  watchAgents,
} = require('./maya-council-watcher.cjs');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function eventLines(rootDir) {
  const eventsFile = getCouncilPaths(rootDir).eventsFile;
  if (!fs.existsSync(eventsFile)) return [];
  return fs.readFileSync(eventsFile, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function loadSession(rootDir) {
  return readJson(getCouncilPaths(rootDir).sessionFile);
}

async function runSmoke() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-council-smoke-'));
  const processed = [];
  const errors = [];

  createSession(rootDir, {
    sessionId: 'cs-smoke-001',
    tasks: [
      {
        task_id: 'TASK_001',
        title: 'Smoke task',
        contract_path: 'contracts/TASK_001.json',
        status: 'assigned',
        assigned_to: 'agent-1',
        assigned_at: '2026-05-28T10:00:00.000Z',
        depends_on: [],
        priority: 1,
      },
    ],
    agentsRegistered: ['agent-1'],
  });

  const handle = watchAgents(rootDir, {
    debounceMs: 25,
    onProcessed(result) {
      processed.push(result);
    },
    onError(err) {
      errors.push(err);
    },
  });

  try {
    registerAgent(rootDir, { agentId: 'agent-1', agentName: 'smoke-worker' });
    await wait(100);
    reportStarted(rootDir, 'agent-1', 'TASK_001');
    await wait(100);
    reportDone(rootDir, 'agent-1', 'TASK_001', {
      self_score: 90,
      review_packet_path: 'review-packets/TASK_001.md',
      last_step: 'smoke complete',
    });
    await wait(250);
  } finally {
    handle.close();
  }

  assert.deepStrictEqual(errors, []);
  assert(processed.some((result) => result.outcome === 'processed'));

  const session = loadSession(rootDir);
  const task = session.task_queue.find((item) => item.task_id === 'TASK_001');
  assert.strictEqual(task.status, 'done');
  assert.strictEqual(session.status, 'complete');

  const events = eventLines(rootDir);
  const eventTypes = events.map((event) => event.type);
  assert(eventTypes.includes('session_opened'));
  assert(eventTypes.includes('task_started'));
  assert(eventTypes.includes('task_done'));
  assert(eventTypes.includes('session_closed'));

  return {
    outcome: 'PASS',
    root_dir: rootDir,
    processed_events: processed.length,
    session_status: session.status,
    task_status: task.status,
    event_types: eventTypes,
  };
}

if (require.main === module) {
  runSmoke()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}

module.exports = {
  runSmoke,
};
