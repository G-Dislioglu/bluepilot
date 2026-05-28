# Builder Adapter Endpoint Boundary v0

Datum: 2026-05-28
Status: BP-010 document-only endpoint boundary
Evidenzbasis: `docs/BUILDER_ADAPTER_CONTRACT_v0.md`, `tools/builder-adapter.cjs`, `tools/test-builder-adapter-fixtures.cjs`, `review-packets/BP-009.md`

Diese Datei definiert die naechste Grenze fuer einen spaeteren mock-backed Endpoint. Sie implementiert keinen Endpoint und fuehrt keine Builder-, Netzwerk- oder Runtime-Calls aus.

## Zweck

Der Endpoint soll spaeter eine stabile Request/Response-Grenze um den lokalen Mock Builder Adapter legen.

Er darf in dieser Phase nur beweisen:

- Request Envelope wird validiert.
- Phase-Scanner-Entscheidung wird respektiert.
- Human Gate blockiert oder erlaubt wie dokumentiert.
- Scope-Verletzungen blockieren.
- No-Go-Operationen blockieren.
- Erfolgreiche Mock-Ausfuehrung bleibt `decision_ready=false`.

## Route-Form

Vorgeschlagene spaetere lokale Route:

```text
POST /api/bluepilot/builder-adapter/mock-run
```

Diese Route ist bewusst als `mock-run` benannt. Ein spaeterer Live-Pfad braucht einen neuen Contract und darf diesen Namen nicht still in echte Builder-Integration umdeuten.

## Request Envelope

Der Endpoint akzeptiert denselben Kern-Envelope wie `docs/BUILDER_ADAPTER_CONTRACT_v0.md` und `tools/builder-adapter.cjs`:

```json
{
  "run_id": "BP-009-HUMAN-REVIEW-APPROVED",
  "task_contract_ref": "contracts/BP-009.json",
  "phase_scanner_result": {
    "decision": "require_human_review",
    "confidence": 0.72,
    "stoplight": "yellow",
    "human_gate_required": true
  },
  "target_repo": "bluepilot",
  "allowed_files": ["docs/example.md"],
  "forbidden_files": [".env*", "package-lock.json"],
  "required_evidence": ["diff_ref", "content_check"],
  "human_gate": {
    "required": true,
    "status": "approved"
  },
  "requested_operations": ["task_create", "execute", "observe"],
  "mock_changed_files": ["docs/example.md"]
}
```

Endpoint-Regeln:

- Request Body muss JSON sein.
- Fehlende Pflichtfelder liefern `status=blocked`.
- `decision=reject` liefert `status=blocked`.
- `decision=require_human_review` mit `human_gate.status != approved` liefert `status=blocked`.
- Verbotene Operationen liefern `status=blocked`.
- Scope-Verletzungen liefern `status=blocked`.
- Erfolgreiche Mock-Laeufe duerfen `status=completed` liefern, aber nicht `decision_ready=true`.

## Response Envelope

Der Endpoint gibt dieselbe Struktur wie der Mock Adapter zurueck:

```json
{
  "adapter_run_id": "mock-builder-adapter-BP-009-HUMAN-REVIEW-APPROVED",
  "status": "completed",
  "builder_task_id": "mock-builder-task-BP-009-HUMAN-REVIEW-APPROVED",
  "decision_ready": false,
  "changed_files": ["docs/example.md"],
  "evidence": {
    "task_evidence_ref": "mock-builder://BP-009-HUMAN-REVIEW-APPROVED/evidence",
    "artifacts_ref": "mock-builder://BP-009-HUMAN-REVIEW-APPROVED/artifacts",
    "task_audit_ref": "mock-builder://BP-009-HUMAN-REVIEW-APPROVED/task-audit",
    "bridge_audit_ref": "mock-builder://mock-builder-adapter-BP-009-HUMAN-REVIEW-APPROVED/bridge-audit"
  },
  "blocked_reasons": [],
  "requires_human_gate": true,
  "mock": true
}
```

Response-Regeln:

- `mock` muss `true` sein.
- `decision_ready` bleibt in der Mock-Phase immer `false`.
- `builder_task_id` darf nur bei `status=completed` gesetzt sein.
- `evidence` darf nur Mock-Referenzen enthalten.
- `blocked_reasons` muss bei `status=blocked` mindestens einen Grund enthalten.

## Fixture-Mapping

Der Endpoint muss spaeter mindestens diese bestehenden Fixtures abbilden:

| Fixture | Erwartung |
|---|---|
| `BP-007.allow.input.json` | `completed`, mock task id, `decision_ready=false` |
| `BP-007.reject.input.json` | `blocked`, kein task id |
| `BP-007.human-review.input.json` | `blocked`, kein task id |
| `BP-008.scope-violation.input.json` | `blocked`, Scope-Grund |
| `BP-008.blocked-operation.input.json` | `blocked`, No-Go-Operation |
| `BP-009.human-review-approved.input.json` | `completed`, mock task id, `decision_ready=false` |

## Nicht-Ziele

Nicht Teil dieser Endpoint-Grenze:

- Live Builder API Calls.
- Netzwerkzugriff.
- GitHub-Zugriff.
- Maya Write.
- AICOS Write.
- Render Integration.
- Auto-Merge.
- Auto-Deploy.
- Persistenz in Datenbank oder Datei.
- Authentifizierung.
- UI.

Diese Punkte brauchen jeweils eigene Contracts, Evidence und Human Gate.

## Implementierungsanforderung fuer spaeter

Ein spaeterer BP-011-Implementierungs-Task darf nur einen mock-backed Endpoint bauen, wenn er:

1. `tools/builder-adapter.cjs` als lokale Logik oder gleichwertige Funktion nutzt.
2. Keine Live-Builder-URL konfiguriert.
3. Die bestehenden Fixtures als Endpoint-Tests wiederverwendet.
4. `mock=true` und `decision_ready=false` in allen erfolgreichen Mock-Antworten bewahrt.
5. WLP-Contract und Review Packet vor Commit bereitstellt.

Bis dahin bleibt BP-010 eine dokumentierte Grenze, kein Runtime-Code.
