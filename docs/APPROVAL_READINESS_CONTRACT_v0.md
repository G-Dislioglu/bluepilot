# Approval Readiness Contract v0

Datum: 2026-05-28
Status: BP-057 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Human Gate Candidate -> Approval Readiness Candidate
```

Er genehmigt keinen Task, speichert kein Approval, erstellt keinen Builder Task und ruft keinen Builder auf.

## Zweck

Approval Readiness klaert lokal, ob ein Human-Gate-Candidate spaeter ueberhaupt in Richtung echter Approval-Wirkung gehen duerfte.

Diese Stufe ist nicht Approval.

Sie beantwortet nur:

- ist die Review-Huelle vollstaendig,
- ist Scope und Evidence sichtbar,
- sind Auth-/Identity-/Persistence-Grenzen noch offen,
- bleibt Task Create blockiert,
- welche Bedingungen muessten vor echter Approval-Wirkung spaeter erfuellt werden.

## Input Envelope

Ein spaeterer Approval-Readiness-Adapter bekommt ein lokales Candidate-Objekt:

```json
{
  "approval_readiness_id": "BP-APPROVAL-READINESS-001",
  "human_gate_candidate": {
    "human_gate_candidate_id": "BP-HUMAN-GATE-CANDIDATE-053-PREPARED",
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
    ],
    "review_notes": []
  },
  "readiness_intent": "prepare_approval_readiness",
  "identity_boundary": "not_configured",
  "persistence_boundary": "not_configured",
  "approval_effect_requested": "none"
}
```

## Pflicht-Inputs

Pflicht:

- `approval_readiness_id`
- `human_gate_candidate.human_gate_candidate_id`
- `human_gate_candidate.status`
- `human_gate_candidate.target_repo`
- `human_gate_candidate.read_scope`
- `human_gate_candidate.write_scope_candidate`
- `human_gate_candidate.required_evidence`
- `human_gate_candidate.review_surface`
- `human_gate_candidate.approval_effect`
- `human_gate_candidate.human_approval_recorded`
- `human_gate_candidate.builder_task_create_allowed`
- `human_gate_candidate.builder_execute_allowed`
- `human_gate_candidate.review_questions`
- `readiness_intent`
- `identity_boundary`
- `persistence_boundary`
- `approval_effect_requested`

`human_gate_candidate.status` muss `review_candidate_prepared` sein.

`human_gate_candidate.approval_effect` muss `none` sein.

`human_gate_candidate.human_approval_recorded` muss `false` sein.

`human_gate_candidate.builder_task_create_allowed` muss `false` sein.

`human_gate_candidate.builder_execute_allowed` muss `false` sein.

`approval_effect_requested` muss im MVP `none` sein.

## Erlaubte Readiness Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_approval_readiness` | nur lokale Readiness-Huelle vorbereiten |

Nicht erlaubt:

- `record_approval`
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
  "approval_readiness_id": "BP-APPROVAL-READINESS-001",
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
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `readiness_candidate_prepared` | lokale Approval-Readiness-Huelle ist beschreibbar, aber Approval bleibt wirkungslos |
| `requires_human_review` | Candidate ist nicht bereit genug fuer Readiness oder enthaelt Risiko-Hinweise |
| `blocked` | harte Regel verletzt |

## Harte Regeln

Immer blockieren:

- Human Gate Candidate Status ist nicht `review_candidate_prepared`,
- `approval_effect` ist nicht `none`,
- `human_approval_recorded` ist nicht `false`,
- `builder_task_create_allowed` ist `true`,
- `builder_execute_allowed` ist `true`,
- `approval_effect_requested` ist nicht `none`,
- `readiness_intent` ist nicht `prepare_approval_readiness`,
- `read_scope` fehlt,
- `required_evidence` fehlt,
- `review_questions` fehlen,
- `blocked_reasons` im Human Gate Candidate sind nicht leer,
- angeforderter Intent ist Record Approval, Approve, Reject, Task Create, Execute, Push, Deploy oder Live Builder Call.

Immer Human Review:

- `write_scope_candidate` ist leer,
- `required_evidence` enthaelt `risk_summary`,
- `review_notes` sind nicht leer,
- `identity_boundary` oder `persistence_boundary` ist nicht explizit `not_configured`,
- Human Gate Candidate Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke.

## Nicht-Ziele

BP-057 erlaubt nicht:

- echte Approval-Aktion bauen,
- Approval speichern,
- Identitaet/Auth einfuehren,
- DB oder Persistenz einfuehren,
- Builder Task Create bauen,
- Builder live aufrufen,
- Builder Adapter ausfuehren,
- Execute / Run / Approve / Push / Deploy bauen,
- Ziel-Dateien schreiben,
- UI bauen.

## Naechster sicherer Schritt

BP-058 kann einen lokalen Approval-Readiness-Candidate Mock bauen.

Dieser Mock darf:

- Human Gate Candidate Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Approval Readiness Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Approval als wirksam speichern,
- Auth/Identity loesen,
- Persistenz einfuehren,
- Builder Task Create ausloesen,
- Builder live aufrufen,
- Dateien veraendern,
- `approval_record_allowed`, `builder_task_create_allowed` oder `builder_execute_allowed` auf `true` setzen.
