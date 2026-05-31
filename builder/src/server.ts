import { createServer } from 'node:http';

import { handleHealthRequest } from './health.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const server = createServer((request, response) => {
  void handleHealthRequest(request, response);
});

server.listen(port, host, () => {
  process.stdout.write(`bluepilot-builder listening on ${host}:${port}\n`);
});
