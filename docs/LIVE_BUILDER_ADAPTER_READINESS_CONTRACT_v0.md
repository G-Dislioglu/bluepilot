# Live Builder Adapter Readiness Contract v0

Datum: 2026-05-28
Status: BP-072 governance contract

Dieser Vertrag beschreibt die naechste Grenze nach Builder Task Create Readiness:

```text
Builder Task Create Readiness Candidate -> Live Builder Adapter Readiness
```

Er implementiert keinen Live Builder Call, keine Auth, keine Secrets, keine Persistenz und keine Builder-Mutation.

## Zweck

Live Builder Adapter Readiness klaert lokal, ob spaeter ein Live-Builder-Adapter ueberhaupt vorbereitet werden duerfte.

Diese Stufe ist nicht Live Builder.

Sie beantwortet nur:

- ist die lokale Kette bis Builder Task Create Readiness sichtbar,
- bleibt Task Create weiterhin blockiert,
- bleibt Execute weiterhin blockiert,
- bleibt Live Builder weiterhin blockiert,
- sind Auth, Secrets, Persistence und Approval Recording weiterhin blockiert,
- welche Bedingungen muessten vor einem echten Live-Adapter spaeter erfuellt werden.

## Beziehung zum bestehenden Live Read Probe

`docs/BUILDER_LIVE_READ_PROBE_CONTRACT_v0.md` beschreibt eine fruehere read-only Mock-Probe-Linie.

Dieser Vertrag ersetzt diese Linie nicht. Er setzt eine zusaetzliche Readiness-Grenze nach der neueren lokalen MVP-Kette.

Wichtig:

- Der bestehende Probe bleibt read-only und mock-first.
- Dieser Vertrag erlaubt keinen Live-Read und keine Mutation.
- Ein spaeterer Implementierungstask muss ausdruecklich entscheiden, ob er die alte Probe-Linie wiederverwendet oder eine neue Readiness-Candidate-Huelle baut.

## Input Envelope

Ein spaeterer Live-Builder-Adapter-Readiness-Adapter bekommt ein lokales Candidate-Objekt:

```json
{
  "live_builder_adapter_readiness_id": "BP-LIVE-BUILDER-ADAPTER-READINESS-001",
  "builder_task_create_readiness": {
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
  },
  "adapter_readiness_intent": "prepare_live_builder_adapter_readiness",
  "live_builder_target": "none",
  "auth_posture": "none",
  "secret_source": "none",
  "persistence_target": "none",
  "network_effect_requested": "none",
  "task_create_effect_requested": "none",
  "execute_effect_requested": "none"
}
```

## Pflicht-Inputs

Pflicht:

- `live_builder_adapter_readiness_id`
- `builder_task_create_readiness.builder_task_create_readiness_id`
- `builder_task_create_readiness.status`
- `builder_task_create_readiness.target_repo`
- `builder_task_create_readiness.builder_adapter_mode`
- `builder_task_create_readiness.task_create_effect`
- `builder_task_create_readiness.execute_effect`
- `builder_task_create_readiness.builder_task_create_allowed`
- `builder_task_create_readiness.builder_execute_allowed`
- `builder_task_create_readiness.live_builder_call_allowed`
- `adapter_readiness_intent`
- `live_builder_target`
- `auth_posture`
- `secret_source`
- `persistence_target`
- `network_effect_requested`
- `task_create_effect_requested`
- `execute_effect_requested`

`builder_task_create_readiness.status` muss `task_create_readiness_prepared` sein.

`builder_adapter_mode`, `task_create_effect`, `execute_effect`, `live_builder_target`, `auth_posture`, `secret_source`, `persistence_target`, `network_effect_requested`, `task_create_effect_requested` und `execute_effect_requested` muessen im MVP `none` sein.

`builder_task_create_allowed`, `builder_execute_allowed` und `live_builder_call_allowed` muessen im MVP `false` sein.

## Erlaubte Adapter Readiness Intent Werte

MVP-erlaubt:

| Wert | Bedeutung |
|---|---|
| `prepare_live_builder_adapter_readiness` | nur lokale Live-Builder-Adapter-Readiness-Huelle vorbereiten |

Nicht erlaubt:

- `live_read`
- `create_task`
- `execute_task`
- `approve_task`
- `push_task`
- `deploy_task`
- `configure_auth`
- `configure_secrets`
- `configure_persistence`
- `configure_builder_adapter`

## Output Envelope

Spaeterer lokaler Output:

```json
{
  "live_builder_adapter_readiness_id": "BP-LIVE-BUILDER-ADAPTER-READINESS-001",
  "status": "live_builder_adapter_readiness_prepared",
  "target_repo": "bluepilot",
  "live_builder_target": "none",
  "auth_posture": "none",
  "secret_source": "none",
  "persistence_target": "none",
  "network_effect": "none",
  "task_create_effect": "none",
  "execute_effect": "none",
  "builder_task_create_allowed": false,
  "builder_execute_allowed": false,
  "live_builder_call_allowed": false,
  "blocked_reasons": [],
  "readiness_notes": [
    "Live Builder adapter readiness is local only. Live Builder, auth, secrets, persistence, task create, approval record, and execute remain blocked."
  ]
}
```

## Statuswerte

| Status | Bedeutung |
|---|---|
| `live_builder_adapter_readiness_prepared` | lokale Live-Builder-Adapter-Readiness-Huelle ist beschreibbar, aber Live Builder bleibt blockiert |
| `requires_human_review` | Readiness enthaelt Risiko- oder Grenzhinweise |
| `blocked` | harte Regel verletzt |

## Harte deterministische Gates

Immer blockieren:

- Builder Task Create Readiness Status ist nicht `task_create_readiness_prepared`,
- `builder_task_create_allowed` ist `true`,
- `builder_execute_allowed` ist `true`,
- `live_builder_call_allowed` ist `true`,
- `builder_adapter_mode` ist nicht `none`,
- `task_create_effect` ist nicht `none`,
- `execute_effect` ist nicht `none`,
- `live_builder_target` ist nicht `none`,
- `auth_posture` ist nicht `none`,
- `secret_source` ist nicht `none`,
- `persistence_target` ist nicht `none`,
- `network_effect_requested` ist nicht `none`,
- `task_create_effect_requested` ist nicht `none`,
- `execute_effect_requested` ist nicht `none`,
- `adapter_readiness_intent` ist nicht `prepare_live_builder_adapter_readiness`,
- angeforderter Intent ist Live Read, Task Create, Execute, Approve, Push, Deploy, Auth, Secrets, Persistence oder Configure Builder Adapter.

Diese Gates sind nicht LLM-gestuetzt. Sie muessen deterministisch pruefbar sein.

## Human Review Trigger

Immer Human Review:

- Builder Task Create Readiness Notes sind nicht leer,
- Builder Task Create Readiness Coverage Map nennt fuer den Fall noch eine offene Fixture-Luecke,
- `target_repo` fehlt oder ist nicht eindeutig,
- konkrete Builder-Zielumgebung ist bereits genannt,
- Auth- oder Secret-Posture ist mehr als `none`,
- ein spaeterer Implementierungstask will bestehende Live-Read-Probe-Logik wiederverwenden.

Human Review ist keine Freigabe fuer Live Builder. Es ist nur ein Stop-Signal fuer die naechste Planung.

## Nicht-Ziele

BP-072 erlaubt nicht:

- Builder live aufrufen,
- Builder Task Create bauen,
- Builder Execute bauen,
- Builder Approve, Push oder Deploy bauen,
- Builder Adapter konfigurieren,
- Auth implementieren,
- Secrets einfuehren,
- DB oder Persistenz einfuehren,
- Approval speichern,
- Approval Record erlauben,
- Ziel-Dateien schreiben,
- UI bauen.

## Fail-Verhalten

Bei harter Regelverletzung:

- `status=blocked`,
- `blocked_reasons` nennt die verletzte Regel,
- `live_builder_call_allowed=false`,
- `builder_task_create_allowed=false`,
- `builder_execute_allowed=false`.

Bei Human-Review-Trigger:

- `status=requires_human_review`,
- `blocked_reasons=[]`,
- `readiness_notes` nennt die Review-Grenze,
- alle Effektfelder bleiben `none`.

Bei unvollstaendigem Input:

- `status=blocked`,
- fehlende Pflichtfelder werden in `blocked_reasons` genannt,
- keine Defaults duerfen Live, Auth, Secret, Persistence, Task Create oder Execute implizieren.

## Naechster sicherer Schritt

BP-073 kann einen lokalen Live-Builder-Adapter-Readiness-Candidate Mock bauen.

Dieser Mock darf:

- Builder Task Create Readiness Output als JSON laden,
- obige Regeln deterministisch pruefen,
- einen lokalen Live Builder Adapter Readiness Output erzeugen,
- Fixtures testen.

Dieser Mock darf nicht:

- Builder live aufrufen,
- Builder Task Create ausloesen,
- Builder Adapter konfigurieren,
- Auth/Secrets/DB/Persistenz einfuehren,
- Approval als wirksam speichern,
- Dateien veraendern,
- `builder_task_create_allowed`, `builder_execute_allowed` oder `live_builder_call_allowed` auf `true` setzen.
