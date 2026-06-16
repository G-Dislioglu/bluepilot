import type { OperatorDashboardModel, OperatorDashboardPanel } from './eightPointIntegrationReadiness.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusLabel(status: OperatorDashboardPanel['status']): string {
  return status.replace(/_/g, ' ');
}

function renderPanel(panel: OperatorDashboardPanel): string {
  const lines = panel.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  return `
    <section class="panel panel-${escapeHtml(panel.status)}" aria-labelledby="${escapeHtml(panel.id)}">
      <div class="panel-head">
        <h2 id="${escapeHtml(panel.id)}">${escapeHtml(panel.title)}</h2>
        <span>${escapeHtml(statusLabel(panel.status))}</span>
      </div>
      <ul>${lines}</ul>
    </section>`;
}

interface ActivationControl {
  id: string;
  title: string;
  endpoint: string;
  payload: Record<string, unknown>;
}

function activationControls(): ActivationControl[] {
  return [
    {
      id: 'provider-preflight',
      title: 'Provider Preflight',
      endpoint: '/probe/provider-runtime-activation-preflight',
      payload: {
        target: 'provider_call',
        requestedBy: 'operator:g-dislioglu',
        providerIsolationRef: 'provider:isolation:review',
        mayaGate: {
          mayaCoreConfigured: true,
          budget: { reachable: true, status: 'reachable', reason: 'under_threshold' },
          cost: { reachable: true, status: 'reachable', recorded: true, reason: 'recorded' },
        },
      },
    },
    {
      id: 'runtime-preflight',
      title: 'Runtime Preflight',
      endpoint: '/probe/provider-runtime-activation-preflight',
      payload: {
        target: 'runtime_dry_run',
        instruction: 'Dry-run activation review only',
        requestedBy: 'operator:g-dislioglu',
        operatorApprovalRef: 'operator:approval:runtime-review',
        providerIsolationRef: 'provider:isolation:runtime-review',
        mayaGateEvidenceRef: 'maya:gate:live',
        maxRuntimeSeconds: 60,
        mayaGate: {
          mayaCoreConfigured: true,
          budget: { reachable: true, status: 'reachable', reason: 'under_threshold' },
          corridor: { reachable: true, status: 'reachable', reason: 'dry_run_allowed' },
        },
      },
    },
    {
      id: 'write-preflight',
      title: 'Write Preflight',
      endpoint: '/probe/maya-core-gate-enforcement-preflight',
      payload: {
        target: 'write_action',
        mayaCoreConfigured: true,
        corridor: { reachable: true, status: 'reachable', reason: 'dry_run_allowed' },
        operatorApprovalRef: 'operator:approval:write-review',
        permitRef: 'permit:one-shot:required',
      },
    },
    {
      id: 'activation-lock',
      title: 'Activation Lock',
      endpoint: '/probe/activation-lock-preflight',
      payload: {
        target: 'runtime_dry_run',
        activationIntentRef: 'activation:intent:operator-review',
        operatorDecisionRef: 'operator:decision:review',
        liveEvidenceRef: 'live:evidence:dashboard',
        providerRuntime: {
          instruction: 'Dry-run activation review only',
          requestedBy: 'operator:g-dislioglu',
          operatorApprovalRef: 'operator:approval:runtime-review',
          providerIsolationRef: 'provider:isolation:runtime-review',
          mayaGateEvidenceRef: 'maya:gate:live',
          maxRuntimeSeconds: 60,
          mayaGate: {
            mayaCoreConfigured: true,
            budget: { reachable: true, status: 'reachable', reason: 'under_threshold' },
            corridor: { reachable: true, status: 'reachable', reason: 'dry_run_allowed' },
          },
        },
      },
    },
  ];
}

function renderActivationControl(control: ActivationControl): string {
  const payload = JSON.stringify(control.payload, null, 2);
  const escapedPayload = escapeHtml(payload);
  return `
    <section class="control" aria-labelledby="${escapeHtml(control.id)}">
      <div class="control-head">
        <h2 id="${escapeHtml(control.id)}">${escapeHtml(control.title)}</h2>
        <code>${escapeHtml(control.endpoint)}</code>
      </div>
      <textarea id="${escapeHtml(control.id)}-payload" readonly rows="10" spellcheck="false">${escapedPayload}</textarea>
      <button type="button" data-copy-target="${escapeHtml(control.id)}-payload">Copy</button>
    </section>`;
}

export function renderOperatorDashboardHtml(model: OperatorDashboardModel): string {
  const panels = model.panels.map(renderPanel).join('');
  const controls = activationControls().map(renderActivationControl).join('');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bluepilot Operator Dashboard Readonly</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17202a;
      --muted: #5d6875;
      --line: #d5dde5;
      --surface: #f5f7f8;
      --white: #ffffff;
      --ready: #176b4d;
      --contract: #285f8f;
      --locked: #785a12;
      --deferred: #8a2f22;
      --button: #20384f;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--surface); color: var(--ink); }
    main { width: min(1180px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 36px; }
    header { border-bottom: 1px solid var(--line); padding-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: 0; }
    h2 { margin: 0; font-size: 16px; line-height: 1.25; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.5; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
    .panel { background: var(--white); border: 1px solid var(--line); border-radius: 8px; padding: 16px; min-height: 150px; }
    .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .panel-head span { border: 1px solid var(--line); border-radius: 999px; padding: 5px 9px; font-size: 12px; text-transform: uppercase; white-space: nowrap; }
    .panel-wired_read_only .panel-head span { color: var(--ready); border-color: color-mix(in srgb, var(--ready), white 68%); }
    .panel-wired_contract_only .panel-head span { color: var(--contract); border-color: color-mix(in srgb, var(--contract), white 68%); }
    .panel-locked_ready_for_review .panel-head span { color: var(--locked); border-color: color-mix(in srgb, var(--locked), white 68%); }
    .panel-deferred_until_lock .panel-head span { color: var(--deferred); border-color: color-mix(in srgb, var(--deferred), white 68%); }
    ul { margin: 0; padding-left: 18px; color: var(--muted); line-height: 1.55; overflow-wrap: anywhere; }
    .controls { margin-top: 22px; border-top: 1px solid var(--line); padding-top: 20px; }
    .controls h2 { font-size: 18px; margin-bottom: 12px; }
    .control-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .control { background: var(--white); border: 1px solid var(--line); border-radius: 8px; padding: 14px; min-width: 0; }
    .control-head { min-height: 54px; display: grid; gap: 6px; align-content: start; margin-bottom: 10px; }
    .control-head code { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
    textarea { width: 100%; min-height: 220px; resize: vertical; border: 1px solid var(--line); border-radius: 6px; padding: 10px; color: var(--ink); background: #fbfcfd; font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
    button { margin-top: 10px; border: 0; border-radius: 6px; background: var(--button); color: white; padding: 8px 12px; font-weight: 600; cursor: pointer; }
    button:focus-visible { outline: 3px solid color-mix(in srgb, var(--button), white 55%); outline-offset: 2px; }
    @media (max-width: 760px) {
      main { width: min(100vw - 20px, 720px); padding-top: 18px; }
      .grid, .control-grid { grid-template-columns: 1fr; }
      textarea { min-height: 240px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(model.headline)}</h1>
      <p>Stand ${escapeHtml(model.generatedAt)}. Diese Surface ist read-only: keine Writes, keine Runtime, keine Provider, kein Deploy, kein Merge.</p>
    </header>
    <div class="grid">${panels}</div>
    <section class="controls" aria-labelledby="activation-controls">
      <h2 id="activation-controls">Activation Controls</h2>
      <div class="control-grid">${controls}</div>
    </section>
  </main>
  <script>
    document.querySelectorAll('button[data-copy-target]').forEach((button) => {
      button.addEventListener('click', async () => {
        const target = document.getElementById(button.dataset.copyTarget || '');
        if (!target) return;
        const value = target instanceof HTMLTextAreaElement ? target.value : target.textContent || '';
        await navigator.clipboard.writeText(value);
      });
    });
  </script>
</body>
</html>`;
}
