# Builder Adapter Contract v0

Datum: 2026-05-28
Status: BP-005 document-only adapter boundary
Evidenzbasis: `docs/BUILDER_DONOR_MAP.md`, `docs/ADAPTER_CONTRACTS_v0.md`, `docs/NO_GO_ZONES.md`, `docs/PHASE_SCANNER_RUNTIME_DECISION_v0.md`

Dieser Vertrag beschreibt, wie Bluepilot spaeter Builder-Donor-Funktionen ansteuern darf. Er implementiert keine Integration und behauptet keine laufende Verbindung zu Builder.

## Zweck

Bluepilot darf Builder als Execution-Donor nutzen, aber nur hinter Phase Scanner, Workcell Lock Protocol, Scope-Gates, Evidence und Human Gate.

Der Adapter ist keine zweite Builder-UI, keine Chat-Fusion und keine direkte Soulmatch-Integration. Er ist eine begrenzte Uebersetzung zwischen einem Bluepilot-Run und vorhandenen Builder-Faehigkeiten.

## Vorbedingungen

Ein Builder-Adapter-Run darf nur vorbereitet werden, wenn alle Bedingungen erfuellt sind:

1. Ein gueltiger WLP-Contract existiert.
2. Der Phase Scanner hat mindestens `allow_single_track` oder `require_human_review` mit anschliessender menschlicher Freigabe geliefert.
3. `forbidden_files` und `allowed_files` sind im Contract gesetzt.
4. Required Evidence ist fuer den Task-Typ definiert.
5. Ein Human Gate ist fuer Merge, Deploy, Promotion und Ausnahmefaelle gesetzt.
6. Der Run braucht keine No-Go-Zone aus `docs/NO_GO_ZONES.md`.

## Erlaubte Donor-Surfaces

### Task Lifecycle

Erlaubt:

- Task anlegen.
- Task lesen.
- Task starten.
- Task verwerfen.
- Task revertieren.
- Task approven nur nach Human Gate.

Builder-Basis laut Donor Map:

- Task CRUD.
- Run.
- Approve.
- Discard.
- Revert.
- Prototype Approve nur bei explizitem Prototype-Run.

### Execution

Erlaubt:

- Execute.
- Observe.
- Execution Result auswerten.
- Worker Direct nur bei eindeutigem Single-Track-Scope.

Eingeschraenkt:

- Swarm und Chain sind im MVP nicht automatisch erlaubt.
- Parallele Tracks brauchen Phase Scanner Independence Check und menschliche Freigabe.

### Scope und File I/O

Erlaubt:

- Scope Resolver vor jedem Write.
- File Read ueber Scope-Gates.
- File Write nur innerhalb `allowed_files`.
- Diff-Erzeugung fuer Evidence.

Nicht erlaubt:

- Cross-Repo-Write ohne expliziten Contract.
- Absolute lokale Pfade.
- `.env*`, Secrets, produktive Credentials.
- Out-of-scope Writes trotz erfolgreicher Execution.

### Evidence

Erlaubt und Pflicht:

- Task Evidence.
- Artifacts.
- Task Audit.
- Bridge Audit.
- Diff-Referenz.
- Testergebnisse oder Runtime Checks je Task-Typ.

Dialog oder Chat-Protokoll darf Kontext sein, ersetzt aber keine Evidence.

### Audit und Operations

Erlaubt:

- Task Audit lesen.
- Bridge Audit lesen.
- Ops Query read-only.
- Team Briefing fuer Worker-Start-Kontext.
- Canary nur als zusaetzliches Promotion-Signal.

Nicht erlaubt:

- Metrics als automatische Freigabe zu behandeln.
- Canary als Ersatz fuer Human Gate zu verwenden.

## Blockierte Donor-Surfaces

Diese Pfade sind fuer den Builder Adapter v0 ausgeschlossen:

- Render Integration.
- Builder Chat Fusion.
- Freier Maya Chat aus Builder.
- Auto-Merge.
- Auto-Deploy.
- AICOS Write oder Mutation.
- Maya Write im MVP.
- Desktop Bridge Write im MVP.
- Automatische Patrol-Reparatur.
- Unbegrenzter Council.
- Unbegrenzte Worker-Tracks.

## Input Envelope

Ein spaeterer Adapter-Aufruf muss mindestens diese Felder erhalten:

```json
{
  "run_id": "BP-RUN-001",
  "task_contract_ref": "contracts/BP-123.json",
  "phase_scanner_result": {
    "decision": "allow_single_track",
    "confidence": 0.87,
    "stoplight": "green",
    "human_gate_required": true
  },
  "target_repo": "bluepilot",
  "allowed_files": ["docs/example.md"],
  "forbidden_files": [".env*", "package-lock.json"],
  "required_evidence": ["diff_ref", "content_check"],
  "human_gate": {
    "required": true,
    "status": "pending"
  }
}
```

Adapter-Regeln:

- `decision=reject` darf keinen Builder-Aufruf erzeugen.
- `decision=require_human_review` darf erst nach expliziter Freigabe weiterlaufen.
- `human_gate.required=true` bleibt bis zur Freigabe blockierend.
- `allowed_files` und `forbidden_files` muessen an Scope-Gates weitergereicht werden.

## Output Envelope

Ein spaeterer Adapter-Aufruf muss mindestens diese Felder zurueckgeben:

```json
{
  "adapter_run_id": "builder-adapter-run-001",
  "status": "completed",
  "builder_task_id": "builder-task-123",
  "decision_ready": false,
  "changed_files": ["docs/example.md"],
  "evidence": {
    "task_evidence_ref": "builder://tasks/123/evidence",
    "artifacts_ref": "builder://tasks/123/artifacts",
    "task_audit_ref": "builder://tasks/123/audit",
    "bridge_audit_ref": "builder://opus-bridge/audit/123"
  },
  "blocked_reasons": [],
  "requires_human_gate": true
}
```

`decision_ready=true` ist nur erlaubt, wenn Evidence vollstaendig ist und keine Scope- oder No-Go-Verletzung vorliegt. Auch dann ersetzt es kein Human Gate.

## Fail-Verhalten

Bei No-Go-Verletzung:

- Kein Builder Run.
- `status=blocked`.
- `blocked_reasons` enthaelt die verletzte Regel.

Bei Scope-Verletzung:

- Builder Write stoppen.
- `status=blocked` oder `status=rework_required`.
- Audit-Referenz sichern, falls schon vorhanden.

Bei fehlender Evidence:

- `decision_ready=false`.
- Human Gate bleibt blockiert.
- Rework oder neuer Evidence-Lauf erforderlich.

Bei Adapter- oder Builder-Fehler:

- Kein automatischer Retry ohne Budget- und Scope-Regel.
- Wiederholte Fehler koennen Council-Trigger erzeugen, starten aber keinen freien Council.

## MVP-Grenze

Builder Adapter v0 ist ein Vertrag, kein Codepfad. Der naechste Implementierungsschritt darf erst beginnen, wenn ein eigener WLP-Contract definiert:

- welche konkrete Builder-Schnittstelle angebunden wird,
- welche Test-/Mock-Strategie gilt,
- wie Scope-Gates maschinell bewiesen werden,
- wie Evidence gespeichert oder referenziert wird,
- welcher Human-Gate-Zustand den Run blockiert oder freigibt.

Bis dahin bleibt Bluepilot auf Dokument-, Contract- und Scanner-Ebene.
