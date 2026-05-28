# Human Gate Handoff v0

Datum: 2026-05-28
Status: BP-052 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Builder Task Contract Candidate -> Human Gate Review Candidate
```

Er genehmigt keinen Task, erstellt keinen Builder Task und ruft keinen Builder auf.

## Zweck

Der Human Gate Handoff verhindert, dass ein lokaler `candidate_prepared` Output automatisch zu Approval, Task Create oder Execute wird.

Vor einem spaeteren Task Create muss sichtbar geklaert werden:

- was genau ein Mensch pruefen soll,
- welche Evidence vorliegt,
- welche Scope-Grenzen gelten,
- welche Blockgruende oder Review-Notizen offen sind,
- ob der Review nur informiert oder spaeter eine echte Freigabe ausloesen darf.

## Input Envelope

Ein spaeterer Human-Gate-Adapter bekommt ein lokales Review-Candidate-Objekt:

```json
{
  "human_gate_candidate_id": "BP-HUMAN-GATE-CANDIDATE-001",
  "builder_task_candidate": {
    "task_contract_candidate_id": "BP-BUILDER-TASK-CANDIDATE-049-PREPARED",
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
    "notes": ["Candidate is local only. Builder Task Create remains blocked."]
  },
  "review_intent": "prepare_human_review_candidate",
  "review_surface": "review_packet",
  "approval_effect": "none"
}
```

## Pflicht-Inputs

Pflicht:

- `human_gate_candidate_id`
- `builder_task_candidate.task_contract_candidate_id`
- `builder_task_candidate.status`
- `builder_task_candidate.target_repo`
- `builder_task_candidate.read_scope`
- `builder_task_candidate.write_scope_candidate`
- `builder_task_candidate.required_evidence`
- `builder_task_candidate.human_gate_required`
- `builder_task_candidate.human_gate_status`
- `builder_task_candidate.builder_task_create_allowed`
- `builder_task_candidate.builder_execute_allowed`
- `review_intent`
- `review_surface`
- `approval_effect`

`builder_task_candidate.status` muss `candidate_prepared` sein.

`builder_task_candidate.human_gate_required` muss `true` sein.

`builder_task_candidate.builder_task_create_allowed` muss `false` sein.

`builder_task_candidate.builder_execute_allowed` muss `false` sein.

`approval_effect` muss im MVP `none` sein.

## Erlaubte Review Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_human_review_candidate` | nur lokale Review-Huelle vorbereiten |

Nicht erlaubt:

- `approve_task`
- `reject_task`
- `create_task`
- `execute_task`
- `push_task`
- `deploy_task`
- `live_builder_call`

## Output Envelope

Spaeterer lokaler Output:

```json
{
  "human_gate_candidate_id": "BP-HUMAN-GATE-CANDIDATE-001",
  "status": "review_candidate_prepared",
  "target_repo": "bluepilot",
  "read_scope": ["docs/example.md"],
  "write_scope_candidate": ["docs/example.md"],
  "required_evidence": ["diff_ref", "task_audit"],
  "review_surface": "review_packet",
  "approval_effect": "none",
  "human_approval_recorded": false,
  "builder_task_create_allowed": false,
  "builder_execute_allowed": false,
  "blocked_reasons": [],
  "review_questions": [
    "Is the scope correct?",
    "Is the evidence sufficient?",
    "Should a later task-create step be allowed?"
  ]
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `review_candidate_prepared` | lokale Human-Review-Huelle ist beschreibbar, aber Approval bleibt wirkungslos |
| `requires_human_review` | Candidate ist nicht bereit genug fuer eine Review-Huelle |
| `blocked` | harte Regel verletzt |

## Harte Regeln

Immer blockieren:

- Builder Task Candidate Status ist nicht `candidate_prepared`,
- `human_gate_required` fehlt oder ist nicht `true`,
- `builder_task_create_allowed` ist `true`,
- `builder_execute_allowed` ist `true`,
- `approval_effect` ist nicht `none`,
- `review_intent` ist nicht `prepare_human_review_candidate`,
- `read_scope` fehlt,
- `required_evidence` fehlt,
- `blocked_reasons` im Candidate sind nicht leer,
- angeforderter Intent ist Approve, Reject, Task Create, Execute, Push, Deploy oder Live Builder Call.

Immer Human Review:

- `write_scope_candidate` ist leer,
- `required_evidence` enthaelt `risk_summary`,
- Candidate Notes enthalten Review- oder Risk-Hinweise,
- Candidate Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke.

## Nicht-Ziele

BP-052 erlaubt nicht:

- echte Approval-Aktion bauen,
- Builder Task Create bauen,
- Builder live aufrufen,
- Builder Adapter ausfuehren,
- Execute / Run / Approve / Push / Deploy bauen,
- Auth oder Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Ziel-Dateien schreiben,
- Human Gate automatisch erfuellen.

## Naechster sicherer Schritt

BP-053 kann einen lokalen Human-Gate-Candidate Mock bauen.

Dieser Mock darf:

- Builder Task Candidate Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Human Gate Candidate Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Approval als wirksam speichern,
- Builder Task Create ausloesen,
- Builder live aufrufen,
- Dateien veraendern,
- Auth/Secrets/DB/Deploy beruehren,
- `builder_task_create_allowed` oder `builder_execute_allowed` auf `true` setzen.
