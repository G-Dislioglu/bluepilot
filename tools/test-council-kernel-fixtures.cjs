#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  ensureCouncilDirs,
  getCouncilPaths,
  readJson,
  readNextDirective,
  acknowledgeDirective,
  registerAgent,
  reportDone,
  reportHardStop,
  reportStarted,
  writeAtomicJson,
} = require('./council-agent-client.cjs');
const { processAgent } = require('./maya-council-watcher.cjs');

function makeRoot(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `bluepilot-${name}-`));
}

function seedSession(rootDir, overrides = {}) {
  const paths = ensureCouncilDirs(rootDir);
  const session = Object.assign({
    session_id: 'cs-test-001',
    opened_at: '2026-05-28T10:00:00.000Z',
    closed_at: null,
    goal_ref: '.specify/.app-goal.md',
    status: 'active',
    agents_registered: ['agent-1', 'agent-2'],
    task_queue: [
      {
        task_id: 'TASK_001',
        title: 'First task',
        contract_path: 'contracts/TASK_001.json',
        status: 'assigned',
        assigned_to: 'agent-1',
        assigned_at: '2026-05-28T10:01:00.000Z',
        depends_on: [],
        priority: 1
      },
      {
        task_id: 'TASK_002',
        title: 'Second task',
        contract_path: 'contracts/TASK_002.json',
        status: 'queued',
        assigned_to: null,
        assigned_at: null,
        depends_on: ['TASK_001'],
        priority: 2
      }
    ],
    directives: [
      {
        directive_id: 'dir-001',
        issued_at: '2026-05-28T10:01:00.000Z',
        target: 'agent-1',
        type: 'assign',
        payload: {
          task_id: 'TASK_001',
          contract_path: 'contracts/TASK_001.json',
          context_hint: null
        }
      }
    ],
    hard_stop_log: [],
    session_summary: null
  }, overrides);
  writeAtomicJson(paths.sessionFile, session);
  writeAtomicJson(paths.dedupFile, {
    session_id: session.session_id,
    processed_events: [],
    last_updated: '2026-05-28T10:00:00.000Z'
  });
  return session;
}

function readSession(rootDir) {
  return readJson(getCouncilPaths(rootDir).sessionFile);
}

function readDedup(rootDir) {
  return readJson(getCouncilPaths(rootDir).dedupFile);
}

function eventLines(rootDir) {
  const eventsFile = getCouncilPaths(rootDir).eventsFile;
  if (!fs.existsSync(eventsFile)) return [];
  return fs.readFileSync(eventsFile, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function testDirectiveCursorAndDoneFlow() {
  const root = makeRoot('council-done');
  seedSession(root);
  registerAgent(root, { agentId: 'agent-1', agentName: 'worker-one' });
  registerAgent(root, { agentId: 'agent-2', agentName: 'worker-two' });

  const directive = readNextDirective(root, 'agent-1');
  assert.strictEqual(directive.directive_id, 'dir-001');
  acknowledgeDirective(root, 'agent-1', directive.directive_id);
  reportStarted(root, 'agent-1', 'TASK_001');
  processAgent(root, 'agent-1');
  reportDone(root, 'agent-1', 'TASK_001', {
    self_score: 88,
    review_packet_path: 'review-packets/TASK_001.md',
    reuse_note: 'TASK_002 may reuse the first task result.'
  });
  const result = processAgent(root, 'agent-1');

  assert.strictEqual(result.outcome, 'processed');
  const session = readSession(root);
  const taskOne = session.task_queue.find((task) => task.task_id === 'TASK_001');
  const taskTwo = session.task_queue.find((task) => task.task_id === 'TASK_002');
  assert.strictEqual(taskOne.status, 'done');
  assert.strictEqual(taskTwo.status, 'assigned');
  assert.strictEqual(taskTwo.assigned_to, 'agent-1');
  assert(session.directives.some((item) => item.type === 'assign' && item.payload.task_id === 'TASK_002'));
  assert(session.directives.some((item) => item.type === 'context_delta'));
  assert(readDedup(root).processed_events.length >= 2);
}

function testDedupDoesNotReprocess() {
  const root = makeRoot('council-dedup');
  seedSession(root);
  registerAgent(root, { agentId: 'agent-1' });
  reportDone(root, 'agent-1', 'TASK_001', { review_packet_path: 'review-packets/TASK_001.md' });

  const first = processAgent(root, 'agent-1');
  const second = processAgent(root, 'agent-1');

  assert.strictEqual(first.outcome, 'processed');
  assert.strictEqual(second.outcome, 'deduplicated');
  assert(eventLines(root).some((event) => event.type === 'event_deduplicated'));
}

function testHardStopPausesSession() {
  const root = makeRoot('council-hard-stop');
  seedSession(root);
  registerAgent(root, { agentId: 'agent-1' });
  reportHardStop(root, 'agent-1', 'TASK_001', 'FORBIDDEN_FILES violated');
  processAgent(root, 'agent-1');

  const session = readSession(root);
  const taskOne = session.task_queue.find((task) => task.task_id === 'TASK_001');
  assert.strictEqual(session.status, 'paused');
  assert.strictEqual(taskOne.status, 'hard_stop');
  assert.strictEqual(session.hard_stop_log.length, 1);
  assert(session.directives.some((item) => item.type === 'broadcast' && item.target === 'all'));
}

testDirectiveCursorAndDoneFlow();
testDedupDoesNotReprocess();
testHardStopPausesSession();

console.log('council kernel fixtures: PASS');
