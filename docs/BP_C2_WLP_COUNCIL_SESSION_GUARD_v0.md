# BP-C2 WLP Council Session Guard v0

Datum: 2026-05-28
Status: BP-093 runtime governance
Phase: BP-C2

## Entscheidung

`verify-task-lock.cjs` bekommt einen optionalen Council-Session-Preflight.

Der Guard greift nur, wenn ein Contract explizit setzt:

```json
{
  "council_session_required": true
}
```

## Warum optional?

Bestehende alte Contracts wurden nicht unter BP-C1 erstellt. Ein pauschaler Pflichtcheck wuerde alte Verifikation brechen.

Fuer neue BP-C2/BP-C3-Tasks kann der Guard im Contract eingeschaltet werden.

## Session-Pfad

Der Guard sucht:

1. `BLUEPILOT_COUNCIL_ROOT/.bluepilot/council/session.json`, falls `BLUEPILOT_COUNCIL_ROOT` gesetzt ist.
2. Sonst `.bluepilot/council/session.json` unter Repo-Root.

Gueltig ist nur:

```json
{
  "status": "active"
}
```

## Fail-Verhalten

- fehlende Session: Exit 2, HARD STOP.
- unlesbare Session: Exit 2, HARD STOP.
- Session nicht `active`: Exit 2, HARD STOP.
- Contract ohne `council_session_required`: altes Verhalten bleibt.
