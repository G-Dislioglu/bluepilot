# Bluepilot Adapter Contracts v0

Datum: 2026-05-25
Status: minimal contracts v0
Evidenzbasis: Builder Ist-Zustand code-review-verified

Diese Datei beschreibt nur minimale Builder-Adapter-Vertraege fuer Funktionen, die heute in der Builder-Ist-Zustand-Liste stehen. Maya-Adapterdetails bleiben bewusst draussen, weil Maya-Core noch nicht schnittreif ist.

## 1. Tasks Contract

Zweck: Bluepilot kann einen begrenzten Builder-Task erzeugen, auslesen und ueber menschliche Gates entscheiden lassen.

Existierende Builder-Basis:

- `GET /api/builder/tasks`
- `POST /api/builder/tasks`
- `GET /api/builder/tasks/:id`
- `DELETE /api/builder/tasks/:id`
- `POST /api/builder/tasks/:id/run`
- `POST /api/builder/tasks/:id/approve`
- `POST /api/builder/tasks/:id/discard`
- `POST /api/builder/tasks/:id/revert`
- `POST /api/builder/tasks/:id/approve-prototype`
- `POST /api/builder/tasks/:id/revise-prototype`

Bluepilot-Regel:

- Task-Erstellung nur nach Phase Scanner.
- Approve/Discard/Revert bleiben Human Gate.
- Prototype-Lane nur verwenden, wenn der Run ausdruecklich als Prototype behandelt wird.

## 2. Execution Contract

Zweck: Bluepilot kann eine Builder-Ausfuehrung starten, beobachten und auf abgeschlossene Worker-Ergebnisse reagieren.

Existierende Builder-Basis:

- `POST /api/builder/opus-bridge/execute`
- `GET /api/builder/opus-bridge/observe/:taskId`
- `POST /api/builder/tasks/:id/execution-result`
- `POST /api/builder/opus-bridge/worker-direct`
- `POST /api/builder/opus-bridge/swarm`
- `POST /api/builder/opus-bridge/chain`

Bluepilot-Regel:

- MVP nutzt Execute und Observe als Kernpfad.
- Worker Direct, Swarm und Chain sind nur kontrolliert nutzbar.
- Swarm nur nach Phase Scanner und Independence Check.
- Execution Result Callback bleibt geschuetzter Callback-Pfad.

## 3. Evidence Contract

Zweck: Jeder Bluepilot-Run endet mit pruefbarem Entscheidungsmaterial.

Existierende Builder-Basis:

- `GET /api/builder/tasks/:id/evidence`
- `GET /api/builder/tasks/:id/artifacts`
- `GET /api/builder/tasks/:id/dialog`
- `GET /api/builder/tasks/:id/audit`

Bluepilot-Regel:

- Kein Run gilt als entscheidungsreif ohne Evidence Bundle.
- Evidence muss Ergebnis, Artefakte und Audit referenzieren.
- Dialog kann als Kontext dienen, ersetzt aber keine Evidence.

## 4. Scope Contract

Zweck: Bluepilot darf Builder-Write-Pfade nur innerhalb erlaubter Dateigrenzen nutzen.

Existierende Builder-Basis:

- `server/src/lib/builderScopeResolver.ts`
- `resolveScope`
- `isIndexedRepoFile`
- `fetchFileContents`
- `probeRepoFilePresence`
- `server/src/lib/builderFileIO.ts`
- `readFile`
- `writeFile`
- `listFiles`
- `findPattern`
- `diffFiles`
- `POST /api/context/files/read`
- `GET /api/builder/files`
- `GET /api/builder/files/*`

Bluepilot-Regel:

- Vor jedem Write muss Scope Resolver laufen.
- Out-of-Scope-Pfade werden hart abgelehnt.
- File I/O wird nur ueber Scope-Gates genutzt.
- Kontextlesen darf generisch sein, Schreiben nicht.

## 5. Audit Contract

Zweck: Bluepilot-Entscheidungen und Builder-Operationen muessen nachvollziehbar bleiben.

Existierende Builder-Basis:

- `GET /api/builder/tasks/:id/audit`
- `GET /api/builder/opus-bridge/audit`
- `GET /api/builder/opus-bridge/metrics`
- `GET /api/builder/team-briefing/template`
- `POST /api/builder/team-briefing/receipt`
- `GET /api/builder/canary`

Bluepilot-Regel:

- Jede relevante Entscheidung bekommt einen Audit-Bezug.
- Bridge Audit und Task Audit werden als Mindestnachweis behandelt.
- Metrics sind Beobachtung, keine Freigabe.
- Canary kann Phase-Promotion stuetzen, ersetzt aber kein Human Gate.

## Nicht in v0

- Kein Render Contract.
- Kein Builder Chat Fusion Contract.
- Kein freier Maya Chat Contract.
- Kein AICOS Write Contract.
- Kein Desktop Bridge Write Contract.
- Keine detaillierten Maya-Adapter-Vertraege.
