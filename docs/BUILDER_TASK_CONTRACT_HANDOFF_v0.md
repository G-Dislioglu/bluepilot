# Builder Task Contract Handoff v0

Datum: 2026-05-28
Status: BP-048 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Scope Resolver Output -> Builder Task Contract Candidate
```

Er erstellt keinen Builder Task und ruft keinen Builder auf.

## Zweck

Der Builder Task Contract Handoff verhindert, dass ein lokal `resolved` Scope Resolver Output direkt zu Task Create, Execute oder Write wird.

Vor einem spaeteren Builder Task Create muss sichtbar geklaert werden:

- welcher Scope aus dem Scope Resolver uebernommen wird,
- welche Evidence fuer den Task Contract verpflichtend ist,
- welcher Human Gate Status noetig ist,
- welche Operation nur als Kandidat beschrieben wird,
- warum `task_create_allowed` noch nicht automatisch `true` wird.

## Input Envelope

Ein spaeterer Builder-Task-Contract-Adapter bekommt ein lokales Candidate-Objekt:

```json
{
  "task_contract_candidate_id": "BP-BUILDER-TASK-CANDIDATE-001",
  "scope_resolver": {
    "handoff_id": "BP-SCOPE-HANDOFF-045-ALLOW",
    "status": "resolved",
    "target_repo": "bluepilot",
    "allowed_read_paths": ["docs/example.md"],
    "allowed_write_paths": ["docs/example.md"],
    "blocked_paths": [],
    "scope_notes": ["Requested scope is repo-relative and single-track."],
    "requires_human_gate": true,
    "writes_allowed_now": false,
    "task_create_allowed": false,
    "required_evidence": ["diff_ref", "task_audit"],
    "blocked_reasons": []
  },
  "task_intent": "prepare_contract_candidate",
  "requested_operation": "document_change_candidate",
  "human_gate": {
    "required": true,
    "status": "not_requested"
  }
}
```

## Pflicht-Inputs

Pflicht:

- `task_contract_candidate_id`
- `scope_resolver.status`
- `scope_resolver.target_repo`
- `scope_resolver.allowed_read_paths`
- `scope_resolver.allowed_write_paths`
- `scope_resolver.requires_human_gate`
- `scope_resolver.writes_allowed_now`
- `scope_resolver.task_create_allowed`
- `scope_resolver.required_evidence`
- `task_intent`
- `requested_operation`
- `human_gate.required`
- `human_gate.status`

`scope_resolver.status` muss `resolved` sein.

`scope_resolver.writes_allowed_now` muss `false` sein.

`scope_resolver.task_create_allowed` muss `false` sein.

`human_gate.required` muss `true` sein.

## Erlaubte Task Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_contract_candidate` | nur lokalen Task-Contract-Kandidaten beschreiben |

Nicht erlaubt:

- `create_task`
- `execute_task`
- `approve_task`
- `push_task`
- `deploy_task`
- `live_builder_call`

## Output Envelope

Spaeterer lokaler Output:

```json
{
  "task_contract_candidate_id": "BP-BUILDER-TASK-CANDIDATE-001",
  "status": "candidate_prepared",
  "target_repo": "bluepilot",
  "read_scope": ["docs/example.md"],
  "write_scope_candidate": ["docs/example.md"],
  "required_evidence": ["diff_ref", "task_audit"],
  "human_gate_required": true,
  "human_gate_status": "not_requested",
  "builder_task_create_allowed": false,
  "builder_execute_allowed": false,
  "blocked_reasons": [],
  "notes": [
    "Candidate is local only. Builder Task Create remains blocked."
  ]
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `candidate_prepared` | lokaler Contract-Kandidat ist beschreibbar, aber Task Create bleibt blockiert |
| `requires_human_review` | Scope oder Human Gate ist nicht bereit fuer Kandidatenbildung |
| `blocked` | harte Regel verletzt |

## Harte Regeln

Immer blockieren:

- Scope Resolver Status ist nicht `resolved`,
- `writes_allowed_now` ist `true`,
- `task_create_allowed` ist `true`,
- Human Gate fehlt,
- Human Gate ist nicht erforderlich,
- `task_intent` ist nicht `prepare_contract_candidate`,
- Scope enthaelt blockierte Pfade,
- Scope enthaelt keine Read Paths,
- `required_evidence` fehlt,
- angeforderte Operation ist Execute, Approve, Push, Deploy oder Live Builder Call.

Immer Human Review:

- `allowed_write_paths` ist leer, aber requested operation braucht Writes,
- Required Evidence enthaelt `risk_summary`,
- Scope Notes enthalten Review-Hinweise,
- Scope Resolver Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke.

## Nicht-Ziele

BP-048 erlaubt nicht:

- Builder Task Create bauen,
- Builder live aufrufen,
- Builder Adapter ausfuehren,
- Execute / Run / Approve / Push / Deploy bauen,
- Auth oder Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Ziel-Dateien schreiben,
- Human Gate automatisch erfuellen.

## Naechster sicherer Schritt

BP-049 kann einen lokalen Builder-Task-Contract-Candidate Mock bauen.

Dieser Mock darf:

- Scope Resolver Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Candidate Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Builder Task Create ausloesen,
- Builder live aufrufen,
- Dateien veraendern,
- Auth/Secrets/DB/Deploy beruehren,
- `builder_task_create_allowed` oder `builder_execute_allowed` auf `true` setzen.
