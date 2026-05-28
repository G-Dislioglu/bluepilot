# Auth/Persistence Readiness Contract v0

Datum: 2026-05-28
Status: BP-062 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Approval Readiness Candidate -> Auth/Persistence Readiness Candidate
```

Er implementiert keine Auth, speichert kein Approval, erstellt keinen Builder Task und ruft keinen Builder auf.

## Zweck

Auth/Persistence Readiness klaert lokal, ob spaeter eine wirksame Approval-Aufzeichnung ueberhaupt vorbereitet werden duerfte.

Diese Stufe ist nicht Auth, nicht Persistence und nicht Approval.

Sie beantwortet nur:

- welche Identity-Grenze spaeter gebraucht wird,
- welche Persistence-Grenze spaeter gebraucht wird,
- welche Audit-Felder fuer Approval Records zwingend waeren,
- warum Approval Recording noch blockiert bleibt,
- warum Task Create noch blockiert bleibt.

## Input Envelope

Ein spaeterer Auth/Persistence-Readiness-Adapter bekommt ein lokales Candidate-Objekt:

```json
{
  "auth_persistence_readiness_id": "BP-AUTH-PERSISTENCE-READINESS-001",
  "approval_readiness": {
    "approval_readiness_id": "BP-APPROVAL-READINESS-058-PREPARED",
    "status": "readiness_candidate_prepared",
    "target_repo": "bluepilot",
    "read_scope": ["docs/example.md"],
    "write_scope_candidate": ["docs/example.md"],
    "required_evidence": ["diff_ref", "task_audit"],
    "identity_boundary": "not_configured",
    "persistence_boundary": "not_configured",
    "approval_effect": "none",
    "human_approval_recorded": false,
    "approval_record_allowed": false,
    "builder_task_create_allowed": false,
    "builder_execute_allowed": false,
    "blocked_reasons": [],
    "readiness_notes": [
      "Approval readiness is local only. Effective approval requires later auth, identity, persistence, and audit decisions."
    ]
  },
  "readiness_intent": "prepare_auth_persistence_readiness",
  "identity_provider": "none",
  "persistence_target": "none",
  "approval_record_effect_requested": "none"
}
```

## Pflicht-Inputs

Pflicht:

- `auth_persistence_readiness_id`
- `approval_readiness.approval_readiness_id`
- `approval_readiness.status`
- `approval_readiness.target_repo`
- `approval_readiness.read_scope`
- `approval_readiness.write_scope_candidate`
- `approval_readiness.required_evidence`
- `approval_readiness.identity_boundary`
- `approval_readiness.persistence_boundary`
- `approval_readiness.approval_effect`
- `approval_readiness.human_approval_recorded`
- `approval_readiness.approval_record_allowed`
- `approval_readiness.builder_task_create_allowed`
- `approval_readiness.builder_execute_allowed`
- `readiness_intent`
- `identity_provider`
- `persistence_target`
- `approval_record_effect_requested`

`approval_readiness.status` muss `readiness_candidate_prepared` sein.

`approval_readiness.approval_effect` muss `none` sein.

`approval_readiness.human_approval_recorded` muss `false` sein.

`approval_readiness.approval_record_allowed` muss `false` sein.

`approval_readiness.builder_task_create_allowed` muss `false` sein.

`approval_readiness.builder_execute_allowed` muss `false` sein.

`identity_provider`, `persistence_target` und `approval_record_effect_requested` muessen im MVP `none` sein.

## Erlaubte Readiness Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_auth_persistence_readiness` | nur lokale Auth-/Persistence-Readiness-Huelle vorbereiten |

Nicht erlaubt:

- `configure_auth`
- `configure_persistence`
- `record_approval`
- `approve_task`
- `create_task`
- `execute_task`
- `push_task`
- `deploy_task`
- `live_builder_call`

## Output Envelope

Spaeterer lokaler Output:

```json
{
  "auth_persistence_readiness_id": "BP-AUTH-PERSISTENCE-READINESS-001",
  "status": "readiness_boundary_prepared",
  "target_repo": "bluepilot",
  "identity_provider": "none",
  "persistence_target": "none",
  "approval_record_effect": "none",
  "identity_ready": false,
  "persistence_ready": false,
  "approval_record_allowed": false,
  "builder_task_create_allowed": false,
  "builder_execute_allowed": false,
  "blocked_reasons": [],
  "readiness_notes": [
    "Auth and persistence are readiness boundaries only. No identity provider, DB, approval record, or Builder action is configured."
  ]
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `readiness_boundary_prepared` | lokale Auth-/Persistence-Readiness-Huelle ist beschreibbar, aber nichts ist konfiguriert |
| `requires_human_review` | Readiness enthaelt Risiko- oder Grenzhinweise |
| `blocked` | harte Regel verletzt |

## Harte Regeln

Immer blockieren:

- Approval Readiness Status ist nicht `readiness_candidate_prepared`,
- `approval_effect` ist nicht `none`,
- `human_approval_recorded` ist nicht `false`,
- `approval_record_allowed` ist `true`,
- `builder_task_create_allowed` ist `true`,
- `builder_execute_allowed` ist `true`,
- `identity_provider` ist nicht `none`,
- `persistence_target` ist nicht `none`,
- `approval_record_effect_requested` ist nicht `none`,
- `readiness_intent` ist nicht `prepare_auth_persistence_readiness`,
- angeforderter Intent ist Configure Auth, Configure Persistence, Record Approval, Approve, Task Create, Execute, Push, Deploy oder Live Builder Call.

Immer Human Review:

- `required_evidence` enthaelt `risk_summary`,
- Approval Readiness Notes sind nicht leer,
- `identity_boundary` oder `persistence_boundary` ist nicht `not_configured`,
- Approval Readiness Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke.

## Nicht-Ziele

BP-062 erlaubt nicht:

- Auth implementieren,
- Identity Provider anbinden,
- Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Approval speichern,
- Approval Record erlauben,
- Builder Task Create bauen,
- Builder live aufrufen,
- Builder Adapter ausfuehren,
- Execute / Run / Approve / Push / Deploy bauen,
- Ziel-Dateien schreiben,
- UI bauen.

## Naechster sicherer Schritt

BP-063 kann einen lokalen Auth/Persistence-Readiness-Candidate Mock bauen.

Dieser Mock darf:

- Approval Readiness Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Auth/Persistence Readiness Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Auth konfigurieren,
- Secrets lesen oder schreiben,
- DB/Persistenz einfuehren,
- Approval als wirksam speichern,
- Builder Task Create ausloesen,
- Builder live aufrufen,
- Dateien veraendern,
- `identity_ready`, `persistence_ready`, `approval_record_allowed`, `builder_task_create_allowed` oder `builder_execute_allowed` auf `true` setzen.
