# Builder Adapter HTTP Mock Route Contract v0

Datum: 2026-05-28
Status: BP-012 document-only HTTP mock route contract
Evidenzbasis: `docs/BUILDER_ADAPTER_ENDPOINT_BOUNDARY_v0.md`, `tools/mock-builder-adapter-endpoint.cjs`, `review-packets/BP-011.md`

Diese Datei definiert den Vertrag fuer eine spaetere lokale HTTP-Mock-Route. Sie implementiert keinen Server und fuehrt keine Netzwerk- oder Builder-Calls aus.

## Zweck

Die Route soll spaeter einen lokalen HTTP-Zugriff auf den bestehenden Mock-Endpoint-Handler erlauben, ohne die Bluepilot-Grenzen zu lockern.

Der Zweck ist nicht Live-Integration, sondern pruefbare Request/Response-Form fuer lokale Tools und spaetere UI- oder Review-Flows.

## Route-Shape

Vorgeschlagener lokaler Pfad:

```text
POST /api/bluepilot/builder-adapter/mock-run
```

Zulaessige Implementierungsform fuer den naechsten Task:

- lokaler Node-HTTP-Server oder bestehender lokaler Projekt-Server, falls einer explizit im Contract erlaubt wird,
- Bindung nur an `127.0.0.1`,
- zufaelliger oder explizit konfigurierter lokaler Port,
- kein automatischer Dev-Server fuer andere App-Bereiche.

## Auth-Posture

MVP-Mock-Route:

- darf keine echten Tokens, Cookies oder Secrets verlangen,
- darf keine produktive Auth simulieren,
- muss in Response und Logs sichtbar `mock=true` behalten,
- darf nur lokale Testrequests akzeptieren.

Wenn eine spaetere Route Auth braucht, ist ein eigener Contract erforderlich.

## Request Parsing

Pflicht:

- Methode muss `POST` sein.
- `Content-Type` muss JSON sein oder der Request wird blockiert.
- Body-Limit: maximal 128 KB.
- Ungueltiges JSON liefert eine blockierte Mock-Response.
- Request-Body muss dem BP-010 Envelope entsprechen.

Blockierte Requests liefern denselben Envelope-Typ wie der Mock-Adapter:

```json
{
  "status": "blocked",
  "builder_task_id": null,
  "decision_ready": false,
  "blocked_reasons": ["invalid JSON"],
  "requires_human_gate": true,
  "mock": true
}
```

## Response Mapping

Die Route muss `tools/mock-builder-adapter-endpoint.cjs` oder eine gleichwertig getestete lokale Funktion wiederverwenden.

Regeln:

- Erfolgreiche Mock-Antworten behalten `decision_ready=false`.
- Alle Antworten behalten `mock=true`.
- `status=blocked` braucht mindestens einen `blocked_reasons`-Eintrag.
- `builder_task_id` darf nur bei `status=completed` gesetzt sein.
- Evidence-Refs duerfen nur `mock-builder://` verwenden.

## No-Network-Garantie

Die Route darf nicht:

- Builder live aufrufen,
- GitHub live aufrufen,
- Render live aufrufen,
- Maya live schreiben,
- AICOS live schreiben,
- externe URLs fetchen,
- Deploy, Merge oder Push ausloesen.

Der naechste Implementierungstask muss beweisen, dass nur lokale Handler/Fixtures verwendet werden.

## Testanforderungen

Ein spaeterer BP-013-Task muss mindestens testen:

1. `POST` mit `BP-007.allow.input.json` -> `completed`, `mock=true`, `decision_ready=false`.
2. `POST` mit `BP-007.reject.input.json` -> `blocked`.
3. `POST` mit `BP-007.human-review.input.json` -> `blocked`.
4. `POST` mit `BP-008.scope-violation.input.json` -> `blocked`.
5. `POST` mit `BP-008.blocked-operation.input.json` -> `blocked`.
6. `POST` mit `BP-009.human-review-approved.input.json` -> `completed`, `mock=true`, `decision_ready=false`.
7. Non-POST request -> blocked or HTTP 405 with mock-safe body.
8. Invalid JSON -> blocked with mock-safe body.

## Nicht-Ziele

Nicht Teil dieser Route:

- Live Builder Integration.
- Externe Netzwerkverbindung.
- Persistenz.
- Auth-System.
- UI.
- Deployment.
- Auto-Merge.
- Auto-Deploy.
- AICOS Write.
- Maya Write.

## BP-013 Implementierungsgrenze

BP-013 darf nur gebaut werden, wenn der Contract:

- den erlaubten Server-Dateipfad nennt,
- die Testdateien nennt,
- `package.json` nur dann erlaubt, wenn ein Script zwingend gebraucht wird,
- keine Live-URL oder Secret-Konfiguration einfuehrt,
- bestehende Fixtures wiederverwendet.

Alles darueber hinaus ist neuer Scope.
