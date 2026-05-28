#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const {
  appendEvent,
  ensureCouncilDirs,
  getCouncilPaths,
  readJson,
  writeAtomicJson,
} = require('./council-agent-client.cjs');

function nowIso() {
  return new Date().toISOString();
}

function listAgents(rootDir) {
  const paths = ensureCouncilDirs(rootDir);
  if (!fs.existsSync(paths.agentsDir)) return [];
  return fs.readdirSync(paths.agentsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(path.join(paths.agentsDir, file), null))
    .filter(Boolean);
}

function createSession(rootDir, options = {}) {
  const paths = ensureCouncilDirs(rootDir);
  const force = options.force === true;

  if (!force && fs.existsSync(paths.sessionFile)) {
    throw new Error('Council session.json already exists. Use force to overwrite.');
  }

  const sessionId = options.sessionId || `cs-${nowIso().replace(/[-:.]/g, '').slice(0, 15)}`;
  const tasks = (options.tasks || []).map((task, index) => {
    return {
      task_id: task.task_id,
      title: task.title || task.task_id,
      contract_path: task.contract_path || null,
      status: task.status || 'queued',
      assigned_to: task.assigned_to || null,
      assigned_at: task.assigned_at || null,
      depends_on: task.depends_on || [],
      priority: task.priority || index + 1,
    };
  });

  const session = {
    session_id: sessionId,
    opened_at: nowIso(),
    closed_at: null,
    goal_ref: options.goalRef || '.specify/.app-goal.md',
    status: 'active',
    agents_registered: options.agentsRegistered || [],
    task_queue: tasks,
    directives: [],
    hard_stop_log: [],
    session_summary: null,
  };

  writeAtomicJson(paths.sessionFile, session);
  writeAtomicJson(paths.dedupFile, {
    session_id: session.session_id,
    processed_events: [],
    last_updated: nowIso(),
  });

  if (!fs.existsSync(paths.eventsFile) || force) {
    fs.writeFileSync(paths.eventsFile, '', 'utf8');
  }
  appendEvent(rootDir, 'maya', 'session_opened', { session_id: session.session_id });

  return session;
}

function loadCouncilState(rootDir) {
  const paths = ensureCouncilDirs(rootDir);
  const session = readJson(paths.sessionFile, null);
  if (!session) {
    throw new Error('Council session.json not found.');
  }

  const dedup = readJson(paths.dedupFile, {
    session_id: session.session_id,
    processed_events: [],
    last_updated: nowIso(),
  });

  if (!Array.isArray(dedup.processed_events)) {
    dedup.processed_events = [];
  }

  return { paths, session, dedup, agents: listAgents(rootDir) };
}

function saveCouncilState(paths, session, dedup) {
  dedup.last_updated = nowIso();
  writeAtomicJson(paths.sessionFile, session);
  writeAtomicJson(paths.dedupFile, dedup);
}

function buildDedupKey(session, agent) {
  return [
    session.session_id,
    agent.agent_id,
    agent.current_task_id || 'none',
    agent.task_attempt || 0,
    agent.status,
    agent.status_revision || 0,
  ].join('::');
}

function findTask(session, taskId) {
  return (session.task_queue || []).find((task) => task.task_id === taskId) || null;
}

function directiveId(session, taskId, agentId) {
  const nextIndex = (session.directives || []).length + 1;
  return `dir-${String(nextIndex).padStart(3, '0')}-${taskId}-${agentId}`;
}

function addDirective(session, target, type, payload) {
  if (!Array.isArray(session.directives)) session.directives = [];
  const directive = {
    directive_id: directiveId(session, payload.task_id || type, target),
    issued_at: nowIso(),
    target,
    type,
    payload,
  };
  session.directives.push(directive);
  return directive;
}

function taskDependenciesDone(session, task) {
  const dependencies = task.depends_on || [];
  return dependencies.every((dependencyId) => {
    const dependency = findTask(session, dependencyId);
    return dependency && dependency.status === 'done';
  });
}

function idleAgents(agents) {
  return agents.filter((agent) => {
    return agent.status === 'idle' || (agent.status === 'done' && !agent.next_assignment_blocked);
  });
}

function assignReadyTasks(rootDir, session, agents) {
  const availableAgents = idleAgents(agents);
  const assigned = [];

  for (const task of session.task_queue || []) {
    if (task.status !== 'queued') continue;
    if (!taskDependenciesDone(session, task)) continue;
    const agent = availableAgents.shift();
    if (!agent) break;

    task.status = 'assigned';
    task.assigned_to = agent.agent_id;
    task.assigned_at = nowIso();

    const directive = addDirective(session, agent.agent_id, 'assign', {
      task_id: task.task_id,
      contract_path: task.contract_path || null,
      context_hint: task.context_hint || null,
    });

    assigned.push({ task, agent, directive });
    appendEvent(rootDir, 'maya', 'task_assigned', {
      task_id: task.task_id,
      to: agent.agent_id,
      directive_id: directive.directive_id,
    });
  }

  return assigned;
}

function pushReuseContextDelta(rootDir, session, sourceAgent) {
  const reuseNote = sourceAgent.result && sourceAgent.result.reuse_note;
  if (!reuseNote) return null;

  const targetTask = (session.task_queue || []).find((task) => task.status === 'assigned' && task.assigned_to);
  if (!targetTask) return null;

  const directive = addDirective(session, targetTask.assigned_to, 'context_delta', {
    task_id: targetTask.task_id,
    delta_reason: `${sourceAgent.current_task_id} reuse note`,
    additions: [
      {
        type: 'reuse_note',
        content: reuseNote,
        source_task: sourceAgent.current_task_id,
        source_agent: sourceAgent.agent_id,
      },
    ],
    removals: [],
  });

  appendEvent(rootDir, 'maya', 'context_delta_pushed', {
    to: targetTask.assigned_to,
    directive_id: directive.directive_id,
    source_task: sourceAgent.current_task_id,
  });

  return directive;
}

function allTasksTerminal(session) {
  const tasks = session.task_queue || [];
  return tasks.length > 0 && tasks.every((task) => {
    return ['done', 'skipped'].includes(task.status);
  });
}

function processAgent(rootDir, agentId) {
  const { paths, session, dedup, agents } = loadCouncilState(rootDir);
  const agent = agents.find((candidate) => candidate.agent_id === agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const key = buildDedupKey(session, agent);
  if (dedup.processed_events.includes(key)) {
    appendEvent(rootDir, 'maya', 'event_deduplicated', { key });
    return { outcome: 'deduplicated', key, session };
  }

  dedup.processed_events.push(key);

  if (agent.status === 'in_progress') {
    const task = findTask(session, agent.current_task_id);
    if (task && task.status === 'assigned') {
      task.status = 'in_progress';
      appendEvent(rootDir, 'maya', 'task_started', {
        task_id: task.task_id,
        by: agent.agent_id,
      });
    }
  }

  if (agent.status === 'done') {
    const task = findTask(session, agent.current_task_id);
    if (task) {
      task.status = 'done';
      task.completed_at = nowIso();
      appendEvent(rootDir, 'maya', 'task_done', {
        task_id: task.task_id,
        by: agent.agent_id,
        review_packet_path: agent.result && agent.result.review_packet_path,
      });
    }
    assignReadyTasks(rootDir, session, agents);
    pushReuseContextDelta(rootDir, session, agent);
  }

  if (agent.status === 'hard_stop') {
    const task = findTask(session, agent.current_task_id);
    if (task) task.status = 'hard_stop';
    session.status = 'paused';
    if (!Array.isArray(session.hard_stop_log)) session.hard_stop_log = [];
    session.hard_stop_log.push({
      ts: nowIso(),
      agent: agent.agent_id,
      task_id: agent.current_task_id,
      reason: agent.blockers && agent.blockers[0] ? agent.blockers[0] : 'No reason provided.',
    });
    addDirective(session, 'all', 'broadcast', {
      action: 'pause_and_wait',
      task_id: agent.current_task_id,
    });
    appendEvent(rootDir, 'maya', 'broadcast', {
      action: 'pause_and_wait',
      task_id: agent.current_task_id,
    });
  }

  if (session.status === 'active' && allTasksTerminal(session)) {
    session.status = 'complete';
    session.closed_at = nowIso();
    session.session_summary = session.session_summary || {
      outcome: 'COMPLETE',
      completed_tasks: (session.task_queue || []).filter((task) => task.status === 'done').length,
    };
    appendEvent(rootDir, 'maya', 'session_closed', { outcome: 'complete' });
  }

  saveCouncilState(paths, session, dedup);
  return { outcome: 'processed', key, session };
}

function runOnce(rootDir) {
  const agents = listAgents(rootDir);
  return agents.map((agent) => processAgent(rootDir, agent.agent_id));
}

function agentIdFromFileName(fileName) {
  if (!fileName || path.basename(fileName) !== fileName) return null;
  if (!fileName.endsWith('.json')) return null;
  if (fileName.endsWith('.tmp')) return null;
  return fileName.slice(0, -'.json'.length);
}

function watchAgents(rootDir, options = {}) {
  const paths = ensureCouncilDirs(rootDir);
  const debounceMs = Number.isInteger(options.debounceMs) ? options.debounceMs : 100;
  const onProcessed = typeof options.onProcessed === 'function' ? options.onProcessed : null;
  const onError = typeof options.onError === 'function' ? options.onError : null;
  const timers = new Map();

  function schedule(fileName) {
    const agentId = agentIdFromFileName(fileName);
    if (!agentId) return;
    if (timers.has(agentId)) clearTimeout(timers.get(agentId));

    timers.set(agentId, setTimeout(() => {
      timers.delete(agentId);
      try {
        const result = processAgent(rootDir, agentId);
        if (onProcessed) onProcessed(result);
      } catch (err) {
        if (onError) {
          onError(err);
        } else {
          console.error(err.message);
        }
      }
    }, debounceMs));
  }

  const watcher = fs.watch(paths.agentsDir, (eventType, fileName) => {
    if (eventType !== 'change' && eventType !== 'rename') return;
    schedule(fileName ? fileName.toString() : null);
  });

  return {
    close() {
      watcher.close();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    },
    processExisting() {
      for (const agent of listAgents(rootDir)) {
        schedule(`${agent.agent_id}.json`);
      }
    },
  };
}

function printUsage() {
  console.log('Usage: node tools/maya-council-watcher.cjs <command> <root> [agent-id]');
  console.log('');
  console.log('Commands:');
  console.log('  init <root> [session-id]');
  console.log('  process-agent <root> <agent-id>');
  console.log('  run-once <root>');
  console.log('  watch <root>');
}

function runCli(argv) {
  const [command, rootDir, agentId] = argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'init') {
    console.log(JSON.stringify(createSession(rootDir || process.cwd(), {
      sessionId: agentId || undefined,
      force: false,
    }), null, 2));
    return 0;
  }

  if (command === 'process-agent') {
    console.log(JSON.stringify(processAgent(rootDir || process.cwd(), agentId), null, 2));
    return 0;
  }

  if (command === 'run-once') {
    console.log(JSON.stringify(runOnce(rootDir || process.cwd()), null, 2));
    return 0;
  }

  if (command === 'watch') {
    const activeRoot = rootDir || process.cwd();
    const paths = getCouncilPaths(activeRoot);
    console.log(`Watching ${paths.agentsDir}`);
    const handle = watchAgents(activeRoot);
    handle.processExisting();
    process.on('SIGINT', () => {
      handle.close();
      process.exit(0);
    });
    return undefined;
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
  addDirective,
  assignReadyTasks,
  agentIdFromFileName,
  buildDedupKey,
  createSession,
  listAgents,
  loadCouncilState,
  processAgent,
  runOnce,
  watchAgents,
};
