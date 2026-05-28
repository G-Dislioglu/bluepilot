# Scope Resolver Handoff Contract v0

Datum: 2026-05-28
Status: BP-044 governance contract

Dieser Vertrag beschreibt den naechsten MVP-Uebergang:

```text
Phase Scanner Output -> Scope Resolver Input
```

Er implementiert keinen Scope Resolver und ruft keinen Builder auf.

## Zweck

Der Scope Resolver Handoff verhindert, dass ein `allow_single_track` aus dem Phase Scanner direkt zu Task Create oder Execute wird.

Zwischen Phase Scanner und Builder Task Create muss sichtbar geklaert werden:

- welche Dateien gelesen werden duerfen,
- welche Dateien geschrieben werden duerfen,
- welche Pfade blockiert sind,
- welche Evidence fuer Scope-Entscheidung gebraucht wird,
- ob Scope breit, wildcard-basiert, extern oder unsicher ist.

## Input Envelope

Ein spaeterer Scope-Resolver-Adapter bekommt ein lokales Handoff-Objekt:

```json
{
  "handoff_id": "BP-SCOPE-HANDOFF-001",
  "phase_scanner": {
    "decision": "allow_single_track",
    "confidence": 1,
    "stoplight": "green",
    "allowed_tracks": [
      {
        "name": "single-builder-task",
        "scope": ["docs/example.md"],
        "requires_human_gate": true
      }
    ],
    "required_evidence": ["diff_ref", "task_audit"],
    "human_gate_required": true
  },
  "target_repo": "bluepilot",
  "requested_scope": ["docs/example.md"],
  "operation_intent": "read_write_candidate",
  "known_risks": [],
  "no_go_zones": ["No auto-merge", "No auto-deploy"]
}
```

## Pflicht-Inputs

Pflicht:

- `handoff_id`
- `phase_scanner.decision`
- `phase_scanner.stoplight`
- `phase_scanner.allowed_tracks`
- `phase_scanner.human_gate_required`
- `target_repo`
- `requested_scope`
- `operation_intent`

`phase_scanner.decision` muss `allow_single_track` sein.

Wenn der Phase Scanner `require_human_review` oder `reject` liefert, darf kein Scope Resolver fuer Task Create starten.

## Operation Intent

MVP-erlaubte Werte:

| Wert | Bedeutung |
|---|---|
| `read_only_candidate` | Scope wird nur fuer Lesen vorbereitet |
| `read_write_candidate` | Scope koennte spaeter Writes erlauben, aber noch kein Write findet statt |

Nicht erlaubt:

- `execute`
- `approve`
- `push`
- `deploy`
- `live_builder_call`

## Output Envelope

Spaeterer Scope Resolver Output:

```json
{
  "handoff_id": "BP-SCOPE-HANDOFF-001",
  "status": "resolved",
  "target_repo": "bluepilot",
  "allowed_read_paths": ["docs/example.md"],
  "allowed_write_paths": ["docs/example.md"],
  "blocked_paths": [],
  "scope_notes": [
    "Requested scope is repo-relative and single-track."
  ],
  "requires_human_gate": true,
  "writes_allowed_now": false,
  "task_create_allowed": false,
  "required_evidence": ["diff_ref", "task_audit"],
  "blocked_reasons": []
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `resolved` | Scope ist lokal begrenzt, aber noch kein Task Create erlaubt |
| `requires_human_review` | Scope ist unklar, breit, wildcard-basiert oder riskant |
| `blocked` | Scope verletzt harte Regeln |

## Harte Regeln

Immer blockieren:

- absolute Pfade,
- `..` Pfade,
- `.env` oder Secret-Dateien,
- externe Pfade,
- leere `requested_scope`,
- mehrere Tracks mit ueberlappendem Scope,
- Phase Scanner Decision `reject`,
- Phase Scanner Decision `require_human_review`,
- fehlender Human Gate Status.

Immer Human Review:

- Wildcards,
- breiter Scope,
- adapterpflichtige Dependencies,
- Daten/Auth/Secret Known Risk,
- Council Trigger,
- niedrige oder gelbe Phase-Scanner Entscheidung.

## Nicht-Ziele

BP-044 erlaubt nicht:

- Builder `builderScopeResolver.ts` importieren,
- Live Builder aufrufen,
- Task Create bauen,
- Execute / Run / Approve / Push / Deploy bauen,
- Auth oder Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Dateien schreiben.

## Naechster sicherer Schritt

BP-045 kann einen lokalen Mock Scope Resolver bauen.

Dieser Mock darf:

- JSON Handoff Input laden,
- obige Regeln deterministisch pruefen,
- Output Envelope erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Builder live aufrufen,
- echte Repo-Dateien veraendern,
- Task Create starten,
- Auth/Secrets/DB/Deploy beruehren.
