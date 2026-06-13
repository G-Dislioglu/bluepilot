import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_OUTPUT = resolve(process.cwd(), 'data/bpk-governance-manifest.json');
const DEFAULT_CONTRACTS = ['BPK-003', 'BPK-004', 'BPK-005', 'BPK-006'];

function parseArgs(argv) {
  const options = {
    output: DEFAULT_OUTPUT,
    check: false,
    contracts: DEFAULT_CONTRACTS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') {
      options.output = resolve(process.cwd(), argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (arg === '--contracts') {
      options.contracts = (argv[index + 1] ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function repoRootFromBuilderCwd() {
  return resolve(process.cwd(), '..');
}

function readContract(repoRoot, taskId) {
  const contractPath = resolve(repoRoot, 'contracts', `${taskId}.json`);
  if (!existsSync(contractPath)) {
    throw new Error(`Contract not found: ${contractPath}`);
  }
  return JSON.parse(readFileSync(contractPath, 'utf8'));
}

function buildCommandManifest(contracts) {
  const commandMap = new Map();
  for (const contract of contracts) {
    for (const command of contract.required_commands ?? []) {
      const entry = commandMap.get(command) ?? { command, taskIds: [] };
      entry.taskIds.push(contract.task_id);
      commandMap.set(command, entry);
    }
  }

  return [...commandMap.values()]
    .map((entry) => ({ command: entry.command, taskIds: [...new Set(entry.taskIds)].sort() }))
    .sort((left, right) => left.command.localeCompare(right.command));
}

function schemaDefinitions() {
  return {
    workerPacketWlpDraft: {
      type: 'object',
      required: ['task_id', 'mode', 'task_type', 'allowed_files', 'forbidden_files', 'evidence_required', 'reuse_target', 'worker_packet'],
      properties: {
        task_id: { type: 'string', pattern: '^[A-Z0-9][A-Z0-9-]{1,80}$' },
        mode: { enum: ['lite', 'standard', 'critical', 'dual-control'] },
        task_type: { enum: ['code_task', 'doc_task', 'ui_task', 'config_task', 'governance_task'] },
        allowed_files: { type: 'array', items: { type: 'string' }, minItems: 1 },
        forbidden_files: { type: 'array', items: { type: 'string' }, minItems: 1 },
        evidence_required: { type: 'array', items: { type: 'string' }, minItems: 1 },
        reuse_target: { type: 'array', items: { enum: ['next_task_pre_lock', 'session_log', 'aicos_card_candidate', 'review_packet'] }, minItems: 1 },
      },
    },
    cardConditionedDispatchPlan: {
      type: 'object',
      required: ['decision', 'dispatchAllowed', 'reviewRequired', 'reasons', 'contractTaskId', 'cards'],
      properties: {
        decision: { enum: ['allow', 'review_required', 'blocked'] },
        dispatchAllowed: { type: 'boolean' },
        reviewRequired: { type: 'boolean' },
        reasons: { type: 'array', items: { type: 'string' } },
        contractTaskId: { type: 'string' },
        cards: { type: 'array', items: { type: 'object' } },
      },
    },
    preRegisteredClaimsGate: {
      type: 'object',
      required: ['decision', 'dispatchAllowed', 'reviewRequired', 'reasons', 'registeredClaims'],
      properties: {
        decision: { enum: ['allow', 'review_required', 'blocked'] },
        dispatchAllowed: { type: 'boolean' },
        reviewRequired: { type: 'boolean' },
        reasons: { type: 'array', items: { type: 'string' } },
        registeredClaims: { type: 'array', items: { type: 'object' } },
      },
    },
  };
}

function buildManifest(taskIds) {
  const repoRoot = repoRootFromBuilderCwd();
  const contracts = taskIds.map((taskId) => readContract(repoRoot, taskId));
  return {
    manifestVersion: 1,
    sourceContracts: contracts.map((contract) => ({
      taskId: contract.task_id,
      taskName: contract.task_name,
      taskType: contract.task_type,
      mode: contract.mode,
      riskClass: contract.risk_class,
    })),
    commandManifest: buildCommandManifest(contracts),
    schemas: schemaDefinitions(),
  };
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = buildManifest(options.contracts);
  const serialized = serialize(manifest);

  if (options.check) {
    const current = existsSync(options.output) ? readFileSync(options.output, 'utf8') : '';
    if (current !== serialized) {
      throw new Error(`${options.output} is not up to date`);
    }
    console.log(`bpk governance manifest ok: ${manifest.sourceContracts.length} contracts, ${manifest.commandManifest.length} commands`);
    return;
  }

  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, serialized);
  console.log(`wrote ${options.output}`);
}

main();
