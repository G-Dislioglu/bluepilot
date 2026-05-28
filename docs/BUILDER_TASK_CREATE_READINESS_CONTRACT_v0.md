# Builder Task Create Readiness Contract v0

Datum: 2026-05-28
Status: BP-067 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Auth/Persistence Readiness Candidate -> Builder Task Create Readiness Candidate
```

Er erstellt keinen Builder Task und ruft keinen Builder auf.

## Zweck

Builder Task Create Readiness klaert lokal, ob spaeter ein Builder-Task-Create ueberhaupt vorbereitet werden duerfte.

Diese Stufe ist nicht Task Create.

Sie beantwortet nur:

- ist die lokale Kette bis Auth/Persistence sichtbar,
- ist Scope und Evidence vorhanden,
- bleiben Auth, Secrets, DB/Persistenz und Approval Record blockiert,
- bleibt der Live-Builder-Adapter blockiert,
- welche Bedingungen muessten vor einem echten Task Create spaeter erfuellt werden.

## Input Envelope

Ein spaeterer Builder-Task-Create-Readiness-Adapter bekommt ein lokales Candidate-Objekt:

```json
{
  "builder_task_create_readiness_id": "BP-BUILDER-TASK-CREATE-READINESS-001",
  "auth_persistence_readiness": {
    "auth_persistence_readiness_id": "BP-AUTH-PERSISTENCE-READINESS-063-PREPARED",
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
  },
  "task_create_intent": "prepare_builder_task_create_readiness",
  "builder_adapter_mode": "none",
  "task_create_effect_requested": "none",
  "execute_effect_requested": "none"
}
```

## Pflicht-Inputs

Pflicht:

- `builder_task_create_readiness_id`
- `auth_persistence_readiness.auth_persistence_readiness_id`
- `auth_persistence_readiness.status`
- `auth_persistence_readiness.target_repo`
- `auth_persistence_readiness.identity_provider`
- `auth_persistence_readiness.persistence_target`
- `auth_persistence_readiness.approval_record_effect`
- `auth_persistence_readiness.identity_ready`
- `auth_persistence_readiness.persistence_ready`
- `auth_persistence_readiness.approval_record_allowed`
- `auth_persistence_readiness.builder_task_create_allowed`
- `auth_persistence_readiness.builder_execute_allowed`
- `task_create_intent`
- `builder_adapter_mode`
- `task_create_effect_requested`
- `execute_effect_requested`

`auth_persistence_readiness.status` muss `readiness_boundary_prepared` sein.

`identity_ready`, `persistence_ready`, `approval_record_allowed`, `builder_task_create_allowed` und `builder_execute_allowed` muessen im MVP `false` sein.

`builder_adapter_mode`, `task_create_effect_requested` und `execute_effect_requested` muessen im MVP `none` sein.

## Erlaubte Task Create Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_builder_task_create_readiness` | nur lokale Task-Create-Readiness-Huelle vorbereiten |

Nicht erlaubt:

- `create_task`
- `execute_task`
- `approve_task`
- `push_task`
- `deploy_task`
- `live_builder_call`
- `configure_builder_adapter`

## Output Envelope

Spaeterer lokaler Output:

```json
{
  "builder_task_create_readiness_id": "BP-BUILDER-TASK-CREATE-READINESS-001",
  "status": "task_create_readiness_prepared",
  "target_repo": "bluepilot",
  "builder_adapter_mode": "none",
  "task_create_effect": "none",
  "execute_effect": "none",
  "builder_task_create_allowed": false,
  "builder_execute_allowed": false,
  "live_builder_call_allowed": false,
  "blocked_reasons": [],
  "readiness_notes": [
    "Task Create readiness is local only. Live Builder, auth, persistence, approval record, and execute remain blocked."
  ]
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `task_create_readiness_prepared` | lokale Task-Create-Readiness-Huelle ist beschreibbar, aber Task Create bleibt blockiert |
| `requires_human_review` | Readiness enthaelt Risiko- oder Grenzhinweise |
| `blocked` | harte Regel verletzt |

## Harte Regeln

Immer blockieren:

- Auth/Persistence Readiness Status ist nicht `readiness_boundary_prepared`,
- `identity_ready` ist `true`,
- `persistence_ready` ist `true`,
- `approval_record_allowed` ist `true`,
- `builder_task_create_allowed` ist `true`,
- `builder_execute_allowed` ist `true`,
- `builder_adapter_mode` ist nicht `none`,
- `task_create_effect_requested` ist nicht `none`,
- `execute_effect_requested` ist nicht `none`,
- `task_create_intent` ist nicht `prepare_builder_task_create_readiness`,
- angeforderter Intent ist Task Create, Execute, Approve, Push, Deploy, Live Builder Call oder Configure Builder Adapter.

Immer Human Review:

- Auth/Persistence Readiness Notes sind nicht leer,
- Auth/Persistence Readiness Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke,
- `target_repo` fehlt oder ist nicht eindeutig,
- Builder Adapter Readiness wurde noch nicht separat definiert.

## Nicht-Ziele

BP-067 erlaubt nicht:

- Builder Task Create bauen,
- Builder live aufrufen,
- Builder Adapter konfigurieren,
- Auth implementieren,
- Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Approval speichern,
- Approval Record erlauben,
- Execute / Run / Approve / Push / Deploy bauen,
- Ziel-Dateien schreiben,
- UI bauen.

## Naechster sicherer Schritt

BP-068 kann einen lokalen Builder-Task-Create-Readiness-Candidate Mock bauen.

Dieser Mock darf:

- Auth/Persistence Readiness Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Builder Task Create Readiness Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Builder Task Create ausloesen,
- Builder live aufrufen,
- Builder Adapter konfigurieren,
- Auth/Secrets/DB/Persistenz einfuehren,
- Approval als wirksam speichern,
- Dateien veraendern,
- `builder_task_create_allowed`, `builder_execute_allowed` oder `live_builder_call_allowed` auf `true` setzen.
