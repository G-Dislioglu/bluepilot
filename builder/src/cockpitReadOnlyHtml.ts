import type { CockpitProjectionAdoptionContract, CockpitProjectionPanel } from './cockpitProjectionAdoptionContract.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusLabel(status: CockpitProjectionAdoptionContract['status'] | CockpitProjectionPanel['status']): string {
  return status.replace(/_/g, ' ');
}

function renderPanel(panel: CockpitProjectionPanel): string {
  const lines = panel.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  return `
    <section class="panel panel-${escapeHtml(panel.status)}" aria-labelledby="panel-${escapeHtml(panel.id)}">
      <div class="panel-head">
        <h2 id="panel-${escapeHtml(panel.id)}">${escapeHtml(panel.title)}</h2>
        <span class="status">${escapeHtml(statusLabel(panel.status))}</span>
      </div>
      <ul>${lines}</ul>
    </section>`;
}

export function renderCockpitReadOnlyHtml(model: CockpitProjectionAdoptionContract): string {
  const panels = model.panels.map(renderPanel).join('');
  const actions = model.actions.map((action) => `
    <button type="button" disabled title="${escapeHtml(action.reason)}">
      ${escapeHtml(action.id.replace(/_/g, ' '))}
    </button>`).join('');
  const reasons = model.reasons.length > 0
    ? `<ul class="reasons">${model.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>`
    : '<p class="quiet">No blocking reasons reported.</p>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bluepilot Cockpit Read-Only</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #15202b;
      --muted: #536471;
      --line: #cfd9de;
      --ready: #127c56;
      --review: #9a5b00;
      --blocked: #b42318;
      --surface: #f7f9f9;
      --white: #ffffff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: var(--surface); }
    main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 36px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: 0; }
    h2 { margin: 0; font-size: 17px; line-height: 1.25; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.5; }
    .badge, .status { border: 1px solid var(--line); border-radius: 999px; padding: 5px 10px; font-size: 13px; text-transform: uppercase; white-space: nowrap; background: var(--white); }
    .badge-ready, .panel-ready .status { color: var(--ready); border-color: color-mix(in srgb, var(--ready), white 68%); }
    .badge-review, .panel-review .status { color: var(--review); border-color: color-mix(in srgb, var(--review), white 65%); }
    .badge-blocked, .panel-blocked .status, .badge-invalid { color: var(--blocked); border-color: color-mix(in srgb, var(--blocked), white 65%); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
    .panel, .actions, .reason-box { background: var(--white); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    .panel-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 12px; }
    ul { margin: 0; padding-left: 18px; color: var(--muted); line-height: 1.55; overflow-wrap: anywhere; }
    .actions, .reason-box { margin-top: 14px; }
    .action-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    button { min-height: 38px; border: 1px solid var(--line); border-radius: 6px; background: #eef2f3; color: var(--muted); padding: 8px 12px; font: inherit; cursor: not-allowed; }
    .quiet { color: var(--muted); }
    @media (max-width: 720px) {
      main { width: min(100vw - 20px, 680px); padding-top: 18px; }
      header { display: block; }
      .badge { display: inline-block; margin-top: 12px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${escapeHtml(model.headline)}</h1>
        <p>Contract ${escapeHtml(model.contractTaskId)} for ${escapeHtml(model.audience)} inspection. This surface is read-only.</p>
      </div>
      <span class="badge badge-${escapeHtml(model.status)}">${escapeHtml(statusLabel(model.status))}</span>
    </header>
    <div class="grid">${panels}</div>
    <section class="reason-box" aria-labelledby="reasons-title">
      <h2 id="reasons-title">Reasons</h2>
      ${reasons}
    </section>
    <section class="actions" aria-labelledby="actions-title">
      <h2 id="actions-title">Actions disabled</h2>
      <div class="action-row">${actions}</div>
    </section>
  </main>
</body>
</html>`;
}
