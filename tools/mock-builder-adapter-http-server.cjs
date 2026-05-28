#!/usr/bin/env node

'use strict';

const http = require('http');
const { handleMockRun } = require('./mock-builder-adapter-endpoint.cjs');
const { blockedOutput } = require('./builder-adapter-core.cjs');

const ROUTE = '/api/bluepilot/builder-adapter/mock-run';
const HOST = '127.0.0.1';
const BODY_LIMIT_BYTES = 128 * 1024;

function mockBlocked(reason, statusCode = 200) {
  return {
    statusCode,
    body: blockedOutput({ run_id: 'http-request' }, 'mock-builder-adapter-http-request', [reason]),
  };
}

function sendJson(res, statusCode, body) {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
  });
  res.end(text);
}

function isJsonContentType(req) {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  return contentType.includes('application/json');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  if (req.url !== ROUTE) {
    const blocked = mockBlocked('unknown route', 404);
    sendJson(res, blocked.statusCode, blocked.body);
    return;
  }

  if (req.method !== 'POST') {
    const blocked = mockBlocked('method must be POST', 405);
    sendJson(res, blocked.statusCode, blocked.body);
    return;
  }

  if (!isJsonContentType(req)) {
    const blocked = mockBlocked('content-type must be application/json', 415);
    sendJson(res, blocked.statusCode, blocked.body);
    return;
  }

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch (err) {
    const blocked = mockBlocked(err.message === 'body too large' ? 'body too large' : 'request body read failed', 413);
    sendJson(res, blocked.statusCode, blocked.body);
    return;
  }

  let input;
  try {
    input = JSON.parse(rawBody.replace(/^\uFEFF/, ''));
  } catch (err) {
    const blocked = mockBlocked('invalid JSON', 200);
    sendJson(res, blocked.statusCode, blocked.body);
    return;
  }

  sendJson(res, 200, handleMockRun(input));
}

function createServer() {
  return http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      sendJson(res, 500, mockBlocked(`unexpected mock route error: ${err.message}`, 500).body);
    });
  });
}

if (require.main === module) {
  const portArg = process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : '0';
  const port = Number(portArg);
  const server = createServer();

  server.listen(port, HOST, () => {
    const address = server.address();
    process.stdout.write(`mock-builder-adapter-http-server listening http://${HOST}:${address.port}${ROUTE}\n`);
  });
}

module.exports = {
  BODY_LIMIT_BYTES,
  HOST,
  ROUTE,
  createServer,
};
