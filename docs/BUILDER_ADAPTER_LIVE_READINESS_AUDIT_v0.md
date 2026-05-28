# Builder Adapter Live Readiness Audit v0

Datum: 2026-05-28
Status: BP-020 governance audit
Evidenzbasis: `docs/BUILDER_DONOR_MAP.md`, `docs/ADAPTER_CONTRACTS_v0.md`, `docs/BUILDER_ADAPTER_PERSISTENCE_DECISION_v0.md`

Diese Datei prueft den naechsten sicheren Live-Builder-Pfad. Sie implementiert keinen Live Call und fuehrt keine Netzwerk-, Secret-, Persistenz- oder Builder-Operation aus.

## Ergebnis

Der erste moegliche Live-Builder-Schritt darf nicht Execution sein.

Sicherster Kandidat fuer spaeter:

```text
read-only Builder Evidence / Task / Audit Probe
```

Noch nicht erlaubt:

- Task erstellen.
- Run starten.
- Execute.
- Worker Direct.
- Swarm.
- Chain.
- Push.
- Approve.
- Discard.
- Revert.
- Deploy.
- Persistenz.

## Warum read-only zuerst

Read-only Evidence/Task/Audit passt zu den bestehenden Donor-Dokumenten:

- `GET /api/builder/tasks/:id/evidence`
- `GET /api/builder/tasks/:id/artifacts`
- `GET /api/builder/tasks/:id/audit`
- `GET /api/builder/opus-bridge/audit`
- `GET /api/builder/opus-bridge/metrics`

Diese Pfade koennen spaeter beweisen:

- Builder ist erreichbar.
- Auth-Posture ist geklaert.
- Response-Mapping funktioniert.
- Evidence kann in Bluepilot-Envelope uebersetzt werden.
- Keine Writes passieren.

## Voraussetzungen vor erstem Live-Read

Ein spaeterer Live-Read-Contract muss mindestens definieren:

- konkrete Zielumgebung,
- Auth-Posture ohne Secrets im Repo,
- erlaubte Read-URLs,
- Timeout,
- Retry-Regel,
- Error Mapping,
- Mock-Fallback,
- No-Write-Beweis,
- Evidence Mapping,
- Review-Suite-Erweiterung,
- Human Gate vor jeder Promotion.

Ohne diese Punkte bleibt Live-Read blockiert.

## Blockierte Pfade

Bis zu separaten Contracts bleiben blockiert:

- `POST /api/builder/tasks`
- `POST /api/builder/tasks/:id/run`
- `POST /api/builder/opus-bridge/execute`
- `POST /api/builder/opus-bridge/worker-direct`
- `POST /api/builder/opus-bridge/swarm`
- `POST /api/builder/opus-bridge/chain`
- `POST /api/builder/tasks/:id/approve`
- `POST /api/builder/tasks/:id/discard`
- `POST /api/builder/tasks/:id/revert`
- Opus Bridge Push.
- Render Integration.
- Builder Chat Fusion.
- AICOS Write.
- Maya Write.

## Evidence Mapping fuer spaeter

Ein Live-Read-Probe sollte spaeter in dieses Bluepilot-Format uebersetzen:

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
  "requires_human_gate": true
}
```

`decision_ready` bleibt auch hier `false`, bis Human Review und Evidence-Pruefung abgeschlossen sind.

## BP-021 Empfehlung

Der naechste sinnvolle Schritt ist kein Live Call.

BP-021 sollte zuerst einen `Builder Live Read Probe Contract` definieren:

- nur read-only,
- kein Secret im Repo,
- keine Persistenz,
- keine Writes,
- keine Execution,
- keine automatische Freigabe,
- mit Mock-Fallback und Tests.

Implementation erst danach.
