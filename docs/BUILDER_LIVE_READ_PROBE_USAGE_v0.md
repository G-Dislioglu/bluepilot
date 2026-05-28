# Builder Live Read Probe Usage v0

Datum: 2026-05-28
Status: BP-023 review usage note
Geltungsbereich: lokaler Mock-Probe aus BP-022

Diese Datei erklaert, wie der Builder Live Read Probe im aktuellen Stand reviewt wird.

Wichtig: Das ist kein Live-Builder-Zugriff. Der Probe liest keine URL, keine Secrets, keine Auth, keine Datenbank und schreibt nichts.

## Zweck

Der Mock-Probe beweist drei Dinge:

1. Die Output-Huelle ist stabil.
2. Die BP-021 Read-Allowlist wird lokal geprueft.
3. Nicht erlaubte Methoden oder Pfade werden blockiert.

Er beweist noch nicht:

- echte Builder-Erreichbarkeit,
- echte Auth,
- echte Evidence-Qualitaet,
- echte Persistenz,
- automatische Freigabe.

## Standard-Review

```bash
node tools/builder-live-read-probe.cjs --input examples/builder-live-read-probe/BP-022.mock.input.json --pretty
```

Erwartung:

- `status` ist `completed`
- `source` ist `mock-builder-read-only`
- `mock` ist `true`
- `writes_attempted` ist `false`
- `decision_ready` ist `false`
- `requires_human_gate` ist `true`
- `builder_refs` enthaelt nur `mock-builder://...` Referenzen

## Block-Review

Verbotene Methode:

```bash
node tools/builder-live-read-probe.cjs --input examples/builder-live-read-probe/BP-022.blocked-method.input.json --pretty
```

Verbotener Pfad:

```bash
node tools/builder-live-read-probe.cjs --input examples/builder-live-read-probe/BP-022.blocked-path.input.json --pretty
```

Erwartung:

- `status` ist `blocked`
- `builder_refs` ist leer
- `blocked_reasons` nennt den Grund
- `writes_attempted` bleibt `false`
- `decision_ready` bleibt `false`
- `requires_human_gate` bleibt `true`

## Review-Suite

Der Probe ist in der Adapter-Review-Suite enthalten:

```bash
node tools/test-builder-adapter-review-suite.cjs
```

Diese Suite prueft Syntax, bestehende Adapter-Fixtures und die neuen Live-Read-Probe-Fixtures.

## Fehlinterpretationen

Nicht als Fortschritt zaehlen:

- Ein `completed` Mock-Output als Live-Erfolg.
- Mock-Refs als echte Builder-Evidence.
- `requires_human_gate=true` als Freigabe.
- `decision_ready=false` als automatische Entscheidung.

## Naechste sichere Grenze

Der naechste sichere Code-Schritt ist weitere lokale Haertung:

- Mode-Block fuer `live`,
- leerer Read-Satz,
- CLI-Golden-Test,
- stabilere Fehlerformate.

Nicht der naechste sichere Code-Schritt:

- echte Builder-Base-URL,
- echte Auth,
- Secrets,
- Persistenz,
- Execute/Approve/Push/Deploy.
