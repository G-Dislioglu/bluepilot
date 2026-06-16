import { createServer } from 'node:http';

import { handleActivationLockRequest } from './activationLockRoute.js';
import { handleCockpitReadOnlyRouteRequest } from './cockpitReadOnlyRoute.js';
import { handleGoatDesktopBridgeRequest } from './goatDesktopBridgeRoute.js';
import { handleHealthRequest } from './health.js';
import { handlePermitApplyRequest } from './permitApply.js';
import { handleMayaCoreGateEnforcementRequest } from './mayaCoreGateEnforcementRoute.js';
import { handleMergeReleaseReadinessRequest } from './mergeReleaseReadinessRoute.js';
import { handleMetaRequest } from './meta.js';
import { handleOperatorDashboardRequest } from './operatorDashboardRoute.js';
import { handleProbeDryRunRequest } from './probeDryRun.js';
import { handleProviderCallExecutorMountLockRequest } from './providerCallExecutorMountLockRoute.js';
import { handleProviderRuntimeActivationRequest } from './providerRuntimeActivationRoute.js';
import { handleReadonlyIntegrationRequest } from './readonlyIntegrationRoutes.js';
import { handleRepoCapabilityAuditRequest } from './repoCapabilityAuditRoute.js';
import { handleRuntimeDryRunExecutorMountLockRequest } from './runtimeDryRunExecutorMountLockRoute.js';
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

    if (await handlePermitApplyRequest(request, response)) {
      return;
    }

    if (await handleProbeDryRunRequest(request, response)) {
      return;
    }

    if (await handleRuntimeDryRunRouteRequest(request, response)) {
      return;
    }

    if (await handleRuntimeDryRunExecutorMountLockRequest(request, response)) {
      return;
    }

    if (await handleProviderCallExecutorMountLockRequest(request, response)) {
      return;
    }

    if (await handleCockpitReadOnlyRouteRequest(request, response)) {
      return;
    }

    if (await handleMetaRequest(request, response)) {
      return;
    }

    if (await handleRepoCapabilityAuditRequest(request, response)) {
      return;
    }

    if (await handleReadonlyIntegrationRequest(request, response)) {
      return;
    }

    if (await handleGoatDesktopBridgeRequest(request, response)) {
      return;
    }

    if (await handleMayaCoreGateEnforcementRequest(request, response)) {
      return;
    }

    if (await handleProviderRuntimeActivationRequest(request, response)) {
      return;
    }

    if (await handleMergeReleaseReadinessRequest(request, response)) {
      return;
    }

    if (await handleActivationLockRequest(request, response)) {
      return;
    }

    if (await handleOperatorDashboardRequest(request, response)) {
      return;
    }

    await handleHealthRequest(request, response);
  })();
});

server.listen(port, host, () => {
  process.stdout.write(`bluepilot-builder listening on ${host}:${port}\n`);
});
