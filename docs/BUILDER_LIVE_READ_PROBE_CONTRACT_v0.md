# Builder Live Read Probe Contract v0

Datum: 2026-05-28
Status: BP-021 governance contract
Evidenzbasis: `docs/BUILDER_ADAPTER_LIVE_READINESS_AUDIT_v0.md`, `docs/BUILDER_DONOR_MAP.md`, `docs/ADAPTER_CONTRACTS_v0.md`

Diese Datei definiert einen spaeteren read-only Builder Probe. Sie implementiert keinen Live Call, keine Auth, keine Persistenz und keine Builder-Mutation.

## Entscheidung

Ein erster Builder-Probe darf nur lesen.

Erlaubte Probe-Klasse:

```text
read-only evidence/task/audit probe
```

Nicht erlaubt:

- Task erstellen.
- Run starten.
- Execute.
- Worker Direct.
- Swarm.
- Chain.
- Approve.
- Discard.
- Revert.
- Push.
- Deploy.
- Persistenz.

## Read-Allowlist

Ein spaeterer Implementierungstask darf nur diese Pfade als Kandidaten nutzen:

```text
GET /api/builder/tasks/:id/evidence
GET /api/builder/tasks/:id/artifacts
GET /api/builder/tasks/:id/audit
GET /api/builder/opus-bridge/audit
GET /api/builder/opus-bridge/metrics
```

Alle `POST`, `PUT`, `PATCH`, `DELETE` Methoden sind fuer diesen Probe blockiert.

## Auth-Posture

Noch keine echte Auth im Repo.

Ein Implementierungstask muss vor Live-Nutzung definieren:

- woher die Ziel-Base-URL kommt,
- wie Auth ausserhalb des Repos bereitgestellt wird,
- wie fehlende Auth zu einem blockierten Probe-Output wird,
- wie Secrets aus Logs und Review Packets ferngehalten werden.

Wenn keine sichere Auth vorhanden ist, muss der Probe in Mock-Fallback laufen.

## Timeout und Retry

Pflicht fuer spaeter:

- Default Timeout: maximal 5 Sekunden pro Read.
- Retry: 0 im ersten Live-Probe.
- Kein automatischer Backoff.
- Kein paralleler Probe.

## Mock-Fallback

Der Probe braucht einen Mock-Fallback, der ohne Netzwerk laeuft.

Mock-Fallback muss beweisen:

- Output Envelope ist stabil.
- `writes_attempted=false`.
- `decision_ready=false`.
- `requires_human_gate=true`.
- Evidence-Refs sind Mock-Refs oder klar als mock markiert.

## Output Envelope

Spaeterer Output:

```json
{
  "probe_id": "BP-LIVE-READ-001",
  "status": "completed",
  "source": "builder-read-only",
  "builder_refs": {
    "task_evidence_ref": "builder://tasks/{id}/evidence",
    "task_audit_ref": "builder://tasks/{id}/audit"
  },
  "writes_attempted": false,
  "decision_ready": false,
  "requires_human_gate": true,
  "mock": false,
  "blocked_reasons": []
}
```

Bei Mock-Fallback:

```json
{
  "probe_id": "BP-LIVE-READ-MOCK",
  "status": "completed",
  "source": "mock-builder-read-only",
  "builder_refs": {
    "task_evidence_ref": "mock-builder://tasks/example/evidence",
    "task_audit_ref": "mock-builder://tasks/example/audit"
  },
  "writes_attempted": false,
  "decision_ready": false,
  "requires_human_gate": true,
  "mock": true,
  "blocked_reasons": []
}
```

## Error Mapping

Spaeterer Probe muss Fehler in blockierte Outputs mappen:

- fehlende Base URL -> `status=blocked`
- fehlende Auth -> `status=blocked`
- nicht erlaubter Pfad -> `status=blocked`
- Timeout -> `status=blocked`
- nicht-JSON Response -> `status=blocked`
- 4xx/5xx -> `status=blocked`

Keine Exception darf als erfolgreiche Probe gelten.

## Testanforderungen fuer BP-022

BP-022 darf nur Mock-Fallback implementieren.

Tests:

1. Mock-Fallback liefert `status=completed`.
2. Mock-Fallback liefert `mock=true`.
3. Mock-Fallback liefert `writes_attempted=false`.
4. Mock-Fallback liefert `decision_ready=false`.
5. Verbotene Methode/Pfad-Konfiguration wird blockiert.
6. Kein Netzwerkzugriff wird benoetigt.
7. Review-Suite bleibt gruen oder wird um Probe-Mock-Tests erweitert.

## BP-022 Grenze

BP-022 darf:

- lokalen Mock-Fallback bauen,
- Probe-Envelope validieren,
- Read-Allowlist pruefen,
- Tests ergaenzen.

BP-022 darf nicht:

- live Builder aufrufen,
- Base URL konfigurieren,
- Secrets lesen,
- Auth implementieren,
- Persistenz bauen,
- Write/Execute/Approve/Push ermoeglichen.
