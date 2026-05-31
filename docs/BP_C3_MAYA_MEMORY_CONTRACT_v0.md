# BP-C3 Maya Memory Contract v0

Datum: 2026-05-28
Status: BP-096 runtime contract
Phase: BP-C3

## Entscheidung

Maya Memory ist ab BP-123 primaer ein duenner Client des gemeinsamen Block-2-Gedaechtnisses in `maya-core`.
Bluepilot schreibt keine bestaetigten Wahrheiten direkt. Schreibvorgaenge werden als Vorschlaege mit
`app_origin='bluepilot'` an `maya-core` gesendet und dort als `review_status='pending'` behandelt.

Der lokale JSON-Pfad bleibt nur als ehrlicher Offline-Fallback erhalten, wenn `maya-core` nicht erreichbar ist.
Fallback-Eintraege werden als `storage='local_json_fallback'` und `offline=true` markiert.

Fallbackpfad:

```text
.bluepilot/maya-memory.json
```

Tests und sichere Runs duerfen einen alternativen Root verwenden.

## Remote-Anbindung

Der Remote-Client liegt in:

```text
tools/maya-memory-remote-client.cjs
```

Er nutzt:

- `MAYA_CORE_URL` als Basis-URL,
- `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN` als Server-zu-Server-Header,
- `POST /api/maya/memory` fuer Vorschlaege,
- `GET /api/maya/memory?origin=bluepilot...` fuer bestaetigte Eintraege.

Wenn der Remote-Pfad nicht erreichbar ist, darf Bluepilot lokal weiterarbeiten, aber nicht so tun,
als sei der Eintrag im gemeinsamen Speicher gelandet.

Ab BP-124 akzeptiert `maya-core` fuer `/api/maya/memory` denselben bestehenden Gate-Auth-Pfad wie
die Builder-Gates: `x-maya-core-gate-token` oder `Authorization: Bearer ...` gegen
`MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`. Die normale Maya-Session-Auth bleibt als
Fallback intakt; fehlende oder falsche Gate-Tokens werden ohne gueltige Session weiter geblockt.

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

Im Remote-Pfad gilt dasselbe Prinzip ueber Block 2: Bluepilot sendet nur Vorschlaege. Prompt-sichtbar
werden Eintraege erst nach Bestaetigung in `maya-core`.

## Key-Mapping

Die vier erlaubten Bluepilot-Keys werden in das gemeinsame Schema gemappt:

- `preferred_models` -> `category='preference'`, `topic='bluepilot.preferred_models'`
- `project_name` -> `category='fact'`, `topic='bluepilot.project_name'`
- `working_dir` -> `category='fact'`, `topic='bluepilot.working_dir'`
- `user_preferences` -> `category='preference'`, `topic='bluepilot.user_preferences'`
