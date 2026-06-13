import { createServer } from 'node:http';

import { handleHealthRequest } from './health.js';
import { handleProbeDryRunRequest } from './probeDryRun.js';
import { handleRuntimeDryRunRouteRequest } from './runtimeDryRunRoute.js';
import { handleSandboxWriteRequest } from './sandboxWrite.js';
import { handleSandboxRealWriteRequest } from './sandboxRealWrite.js';
import { handleSandboxWriteProbeRequest } from './sandboxWriteProbe.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const server = createServer((request, response) => {
  void (async () => {
    if (await handleSandboxWriteRequest(request, response)) {
      return;
    }

    if (await handleSandboxRealWriteRequest(request, response)) {
      return;
    }

    if (await handleSandboxWriteProbeRequest(request, response)) {
      return;
    }

    if (await handleProbeDryRunRequest(request, response)) {
      return;
    }

    if (await handleRuntimeDryRunRouteRequest(request, response)) {
      return;
    }

    await handleHealthRequest(request, response);
  })();
});

server.listen(port, host, () => {
  process.stdout.write(`bluepilot-builder listening on ${host}:${port}\n`);
});
