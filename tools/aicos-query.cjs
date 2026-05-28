#!/usr/bin/env node

'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const DEFAULT_INDEX_URL = 'https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/master/index/INDEX.json';
const STOPWORDS = new Set(['the', 'and', 'oder', 'und', 'for', 'mit', 'eine', 'einen', 'task', 'bp', 'c3']);

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9_-]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOPWORDS.has(item) && !/^bp-c\d+$/.test(item));
}

function flattenCardText(card) {
  return {
    id: card.id || card.card_id || card.token || null,
    title: String(card.title || ''),
    token: String(card.token || ''),
    type: String(card.type || ''),
    tags: Array.isArray(card.tags) ? card.tags.join(' ') : String(card.tags || ''),
    domain: Array.isArray(card.domain) ? card.domain.join(' ') : String(card.domain || ''),
  };
}

function loadIndexFromFile(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function fetchIndex(url = DEFAULT_INDEX_URL) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'bluepilot-aicos-query-readonly' } }, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`Fetch failed: HTTP ${response.statusCode}`));
        response.resume();
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function normalizeCards(index) {
  if (Array.isArray(index)) return index;
  if (Array.isArray(index.cards)) return index.cards;
  if (Array.isArray(index.items)) return index.items;
  throw new Error('Unsupported AICOS index shape.');
}

function scoreCard(queryTokens, card) {
  const text = flattenCardText(card);
  if (!text.id) return null;

  let score = 0;
  const reasons = [];
  const fields = [
    ['title', text.title, 3],
    ['token', text.token, 3],
    ['tags', text.tags, 2],
    ['domain', text.domain, 1],
    ['type', text.type, 1],
  ];

  for (const token of queryTokens) {
    for (const [field, value, weight] of fields) {
      if (String(value).toLowerCase().includes(token)) {
        score += weight;
        reasons.push(`${field}:${token}`);
      }
    }
  }

  if (score === 0) return null;
  return {
    card_id: text.id,
    title: text.title || null,
    type: text.type || null,
    score,
    reasons: [...new Set(reasons)],
  };
}

function queryCards(index, query, options = {}) {
  const queryTokens = tokenize(query);
  const limit = options.limit || 10;
  const matches = normalizeCards(index)
    .map((card) => scoreCard(queryTokens, card))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.card_id.localeCompare(b.card_id))
    .slice(0, limit);

  return {
    query,
    query_tokens: queryTokens,
    source: options.source || 'local',
    matches,
    write_mode: 'read_only',
  };
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function printUsage() {
  console.log('Usage: node tools/aicos-query.cjs query "<text>" [--index <path>|--fetch]');
}

async function runCli(argv) {
  const [command, queryText, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }
  if (command !== 'query') throw new Error(`Unknown command: ${command}`);
  if (!queryText) throw new Error('Query text is required.');

  const indexPath = getArg(rest, '--index');
  const useFetch = rest.includes('--fetch');
  const index = indexPath ? loadIndexFromFile(indexPath) : await fetchIndex();
  const source = indexPath ? `file:${path.resolve(indexPath)}` : (useFetch ? DEFAULT_INDEX_URL : DEFAULT_INDEX_URL);
  console.log(JSON.stringify(queryCards(index, queryText, { source }), null, 2));
  return 0;
}

if (require.main === module) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_INDEX_URL,
  fetchIndex,
  loadIndexFromFile,
  queryCards,
  tokenize,
};
