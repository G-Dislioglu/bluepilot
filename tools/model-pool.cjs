#!/usr/bin/env node

'use strict';

const PROVIDERS = Object.freeze({
  claude: {
    provider: 'claude',
    label: 'Claude',
    default_model: 'claude-opus-or-sonnet',
    strengths: ['reasoning', 'review', 'long_context'],
  },
  gpt: {
    provider: 'gpt',
    label: 'GPT',
    default_model: 'gpt-5-class',
    strengths: ['tool_use', 'code', 'generalist'],
  },
  gemini: {
    provider: 'gemini',
    label: 'Gemini',
    default_model: 'gemini-pro-class',
    strengths: ['long_context', 'multimodal', 'fast_scan'],
  },
  glm: {
    provider: 'glm',
    label: 'GLM',
    default_model: 'glm-coding-class',
    strengths: ['code', 'structured_tasks', 'cost_sensitive'],
  },
  kimi: {
    provider: 'kimi',
    label: 'Kimi',
    default_model: 'kimi-long-context-class',
    strengths: ['long_context', 'repo_scan', 'summarization'],
  },
});

const ROLE_ROUTES = Object.freeze({
  scout: ['kimi', 'gemini', 'gpt'],
  worker: ['gpt', 'claude', 'glm'],
  judge: ['claude', 'gpt', 'gemini'],
  maya: ['claude', 'gpt', 'kimi'],
});

const CAPABILITY_HINTS = Object.freeze({
  code: ['gpt', 'glm', 'claude'],
  long_context: ['kimi', 'gemini', 'claude'],
  review: ['claude', 'gpt', 'gemini'],
  fast_scan: ['gemini', 'kimi', 'gpt'],
});

function listProviders() {
  return Object.values(PROVIDERS).map((provider) => ({ ...provider }));
}

function assertKnownRole(role) {
  if (!ROLE_ROUTES[role]) {
    throw new Error(`Unknown role: ${role}`);
  }
}

function rankCandidates(role, capability) {
  assertKnownRole(role);
  const base = ROLE_ROUTES[role];
  const hinted = capability && CAPABILITY_HINTS[capability] ? CAPABILITY_HINTS[capability] : [];
  const merged = [...hinted, ...base];
  return [...new Set(merged)].filter((provider) => PROVIDERS[provider]);
}

function routeForRole(role, options = {}) {
  const candidates = rankCandidates(role, options.capability);
  return {
    role,
    capability: options.capability || null,
    selected: candidates[0],
    candidates: candidates.map((provider) => PROVIDERS[provider]),
    execution: 'route_only_no_api_call',
  };
}

function printUsage() {
  console.log('Usage: node tools/model-pool.cjs <command>');
  console.log('');
  console.log('Commands:');
  console.log('  list');
  console.log('  route <scout|worker|judge|maya> [--capability <name>]');
}

function parseCapability(args) {
  const index = args.indexOf('--capability');
  if (index === -1) return null;
  return args[index + 1] || null;
}

function runCli(argv) {
  const [command, role, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'list') {
    console.log(JSON.stringify({ providers: listProviders(), roles: Object.keys(ROLE_ROUTES) }, null, 2));
    return 0;
  }

  if (command === 'route') {
    console.log(JSON.stringify(routeForRole(role, { capability: parseCapability(rest) }), null, 2));
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
  CAPABILITY_HINTS,
  PROVIDERS,
  ROLE_ROUTES,
  listProviders,
  routeForRole,
};
