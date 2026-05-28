#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function nowIso() {
  return new Date().toISOString();
}

function getCouncilPaths(rootDir = process.cwd()) {
  const councilDir = path.resolve(rootDir, '.bluepilot', 'council');
  return {
    rootDir: path.resolve(rootDir),
    councilDir,
    sessionFile: path.join(councilDir, 'session.json'),
    agentsDir: path.join(councilDir, 'agents'),
    eventsFile: path.join(councilDir, 'events.jsonl'),
    contextSnapshotFile: path.join(councilDir, 'context-snapshot.json'),
    dedupFile: path.join(councilDir, 'dedup.json'),
  };
}

function ensureCouncilDirs(rootDir = process.cwd()) {
  const paths = getCouncilPaths(rootDir);
  fs.mkdirSync(paths.agentsDir, { recursive: true });
  return paths;
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeAtomicJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmpFile, filePath);
}

function appendEvent(rootDir, from, type, payload = {}) {
  const paths = ensureCouncilDirs(rootDir);
  const line = JSON.stringify({ ts: nowIso(), from, type, payload });
  fs.appendFileSync(paths.eventsFile, `${line}\n`, 'utf8');
}

function agentFile(rootDir, agentId) {
  return path.join(getCouncilPaths(rootDir).agentsDir, `${agentId}.json`);
}

function loadSession(rootDir = process.cwd()) {
  const session = readJson(getCouncilPaths(rootDir).sessionFile, null);
  if (!session) {
    throw new Error('Council session.json not found.');
  }
  return session;
}

function loadAgent(rootDir, agentId) {
  const agent = readJson(agentFile(rootDir, agentId), null);
  if (!agent) {
    throw new Error(`Agent file not found: ${agentId}`);
  }
  return agent;
}

function saveAgent(rootDir, agent) {
  writeAtomicJson(agentFile(rootDir, agent.agent_id), agent);
}

function nextRevision(agent) {
  return Number.isInteger(agent.status_revision) ? agent.status_revision + 1 : 1;
}

function registerAgent(rootDir, options) {
  if (!options || !options.agentId) {
    throw new Error('registerAgent requires agentId.');
  }

  ensureCouncilDirs(rootDir);
  const existing = readJson(agentFile(rootDir, options.agentId), null);
  const agent = {
    agent_id: options.agentId,
    agent_name: options.agentName || options.agentId,
    registered_at: existing ? existing.registered_at : nowIso(),
    last_updated: nowIso(),
    status: 'idle',
    status_revision: existing ? nextRevision(existing) : 0,
    task_attempt: existing && Number.isInteger(existing.task_attempt) ? existing.task_attempt : 0,
    current_task_id: null,
    directive_cursor: existing ? existing.directive_cursor : null,
    progress: null,
    result: null,
    blockers: [],
    message_to_maya: options.message || 'Agent registered.',
  };

  saveAgent(rootDir, agent);
  appendEvent(rootDir, options.agentId, 'agent_registered', { agent_id: options.agentId });
  return agent;
}

function directivesForAgent(session, agentId) {
  return (session.directives || []).filter((directive) => {
    return directive.target === agentId || directive.target === 'all';
  });
}

function readNextDirective(rootDir, agentId) {
  const session = loadSession(rootDir);
  const agent = loadAgent(rootDir, agentId);
  const directives = directivesForAgent(session, agentId);
  const lastSeenId = agent.directive_cursor && agent.directive_cursor.last_seen_directive_id;
  const lastSeenIndex = lastSeenId
    ? directives.findIndex((directive) => directive.directive_id === lastSeenId)
    : -1;

  return directives[lastSeenIndex + 1] || null;
}

function acknowledgeDirective(rootDir, agentId, directiveId) {
  const agent = loadAgent(rootDir, agentId);
  agent.directive_cursor = {
    last_seen_directive_id: directiveId,
    last_seen_at: nowIso(),
  };
  agent.last_updated = nowIso();
  saveAgent(rootDir, agent);
  appendEvent(rootDir, agentId, 'directive_acknowledged', { directive_id: directiveId });
  return agent;
}

function reportStarted(rootDir, agentId, taskId) {
  const agent = loadAgent(rootDir, agentId);
  agent.status = 'in_progress';
  agent.status_revision = nextRevision(agent);
  agent.task_attempt = agent.task_attempt > 0 ? agent.task_attempt : 1;
  agent.current_task_id = taskId;
  agent.last_updated = nowIso();
  agent.progress = {
    phase: 'build',
    percent: 1,
    last_step: `started ${taskId}`,
  };
  agent.result = null;
  agent.blockers = [];
  agent.message_to_maya = `${taskId} started.`;
  saveAgent(rootDir, agent);
  appendEvent(rootDir, agentId, 'task_started', { task_id: taskId });
  return agent;
}

function reportDone(rootDir, agentId, taskId, result) {
  const agent = loadAgent(rootDir, agentId);
  agent.status = 'done';
  agent.status_revision = nextRevision(agent);
  agent.task_attempt = agent.task_attempt > 0 ? agent.task_attempt : 1;
  agent.current_task_id = taskId;
  agent.last_updated = nowIso();
  agent.progress = {
    phase: 'verify',
    percent: 100,
    last_step: result && result.last_step ? result.last_step : `verified ${taskId}`,
  };
  agent.result = Object.assign({ outcome: 'COMPLETE' }, result || {});
  agent.blockers = [];
  agent.message_to_maya = `${taskId} complete.`;
  saveAgent(rootDir, agent);
  appendEvent(rootDir, agentId, 'task_done', { task_id: taskId });
  return agent;
}

function reportHardStop(rootDir, agentId, taskId, reason) {
  const agent = loadAgent(rootDir, agentId);
  agent.status = 'hard_stop';
  agent.status_revision = nextRevision(agent);
  agent.task_attempt = agent.task_attempt > 0 ? agent.task_attempt : 1;
  agent.current_task_id = taskId;
  agent.last_updated = nowIso();
  agent.progress = {
    phase: 'hard_stop',
    percent: 0,
    last_step: reason,
  };
  agent.result = null;
  agent.blockers = [reason];
  agent.message_to_maya = `HARD STOP - ${reason}`;
  saveAgent(rootDir, agent);
  appendEvent(rootDir, agentId, 'task_hard_stop', { task_id: taskId, reason });
  return agent;
}

function printUsage() {
  console.log('Usage: node tools/council-agent-client.cjs <command> [args]');
  console.log('');
  console.log('Commands:');
  console.log('  register <root> <agent-id> [agent-name]');
  console.log('  next-directive <root> <agent-id>');
  console.log('  ack <root> <agent-id> <directive-id>');
  console.log('  started <root> <agent-id> <task-id>');
  console.log('  done <root> <agent-id> <task-id>');
  console.log('  hard-stop <root> <agent-id> <task-id> <reason>');
}

function runCli(argv) {
  const [command, rootArg, agentId, third, ...rest] = argv;
  const rootDir = rootArg || process.cwd();

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'register') {
    console.log(JSON.stringify(registerAgent(rootDir, { agentId, agentName: third }), null, 2));
    return 0;
  }

  if (command === 'next-directive') {
    console.log(JSON.stringify(readNextDirective(rootDir, agentId), null, 2));
    return 0;
  }

  if (command === 'ack') {
    console.log(JSON.stringify(acknowledgeDirective(rootDir, agentId, third), null, 2));
    return 0;
  }

  if (command === 'started') {
    console.log(JSON.stringify(reportStarted(rootDir, agentId, third), null, 2));
    return 0;
  }

  if (command === 'done') {
    console.log(JSON.stringify(reportDone(rootDir, agentId, third, { self_score: 80 }), null, 2));
    return 0;
  }

  if (command === 'hard-stop') {
    console.log(JSON.stringify(reportHardStop(rootDir, agentId, third, rest.join(' ') || 'No reason provided.'), null, 2));
    return 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

module.exports = {
  appendEvent,
  ensureCouncilDirs,
  getCouncilPaths,
  loadAgent,
  loadSession,
  readJson,
  readNextDirective,
  acknowledgeDirective,
  registerAgent,
  reportDone,
  reportHardStop,
  reportStarted,
  saveAgent,
  writeAtomicJson,
  _private: {
    agentFile,
    nextRevision,
    nowIso,
    osTmpDir: os.tmpdir,
  },
};
