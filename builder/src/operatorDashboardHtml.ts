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

export function renderOperatorDashboardHtml(model: OperatorDashboardModel): string {
  const panels = model.panels.map(renderPanel).join('');

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
    @media (max-width: 760px) {
      main { width: min(100vw - 20px, 720px); padding-top: 18px; }
      .grid { grid-template-columns: 1fr; }
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
  </main>
</body>
</html>`;
}
