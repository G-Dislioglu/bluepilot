# BP-C3 Maya Memory Contract v0

Datum: 2026-05-28
Status: BP-096 runtime contract
Phase: BP-C3

## Entscheidung

Maya Memory startet als lokale JSON-Datei.

Standardpfad:

```text
.bluepilot/maya-memory.json
```

Tests und sichere Runs duerfen einen alternativen Root verwenden.

## Erlaubte Keys

- `preferred_models`
- `project_name`
- `working_dir`
- `user_preferences`

## Grenzen

Nicht enthalten:

- kein affective Memory,
- keine Embeddings,
- kein Cross-Session-Inference,
- keine automatische Wahrheitspromotion,
- kein UI,
- keine DB.

## Proposal-only

Eintragungen sind standardmaessig `proposal_only: true`.

Das bedeutet: Memory ist Hinweis, nicht Wahrheit.
