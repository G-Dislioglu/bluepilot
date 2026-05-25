# Bluepilot Phase Scanner Spec v0

Datum: 2026-05-25
Status: phase-0 contract spec
Evidenzbasis: Bluepilot synthesis v0, Builder Donor Map v0, Adapter Contracts v0

Der Phase Scanner ist der Gatekeeper vor jedem Builder-Run. Er entscheidet nicht, ob eine Idee gut ist. Er entscheidet, ob sie klein, sicher, belegbar und klar genug ist, um Builder-Donor-Funktionen auszufuehren.

## Zweck

Der Phase Scanner verhindert, dass Bluepilot:

- zu breite Auftraege direkt in Builder-Tasks uebersetzt,
- parallele Tracks ohne echte Unabhaengigkeit startet,
- risky Writes ohne Scope- und Evidence-Basis zulaesst,
- Council oder Human Review zu spaet triggert,
- Aktivitaet mit Fortschritt verwechselt.

## Inputs

| Input | Bedeutung |
|---|---|
| `idea` | Nutzerauftrag oder Intake-Idee |
| `target_repo` | Repo, gegen das gearbeitet werden soll |
| `requested_scope` | vermutete Dateien, Module oder Produktflaechen |
| `repo_context` | gelesener Kontext, zum Beispiel Files Read oder Architecture Digest |
| `known_risks` | bekannte Drift-, Runtime-, Deploy- oder Produktentscheidungsrisiken |
| `available_donors` | nutzbare Builder-Donor-Funktionen fuer diesen Run |
| `no_go_zones` | harte Verbote aus `NO_GO_ZONES.md` |

## Checks

### 1. Scope-Clarity Check

Frage: Ist der Auftrag so klar, dass ein begrenzter Task daraus entstehen kann?

Erlaubt, wenn:

- Ziel und erwartetes Ergebnis benennbar sind.
- betroffene Faecher oder Dateien grob bestimmbar sind.
- Erfolg oder Scheitern durch Evidence pruefbar ist.

Blockiert, wenn:

- der Auftrag mehrere Produktentscheidungen vermischt.
- unklar ist, welches Repo oder welche Flaeche betroffen ist.
- kein pruefbares Ergebnis formulierbar ist.

### 2. File-Risk Check

Frage: Sind die voraussichtlichen Dateioperationen durch Scope Resolver und File I/O sicher begrenzbar?

Erlaubt, wenn:

- die benoetigten Dateien im Repo-Kontext auffindbar sind.
- Out-of-Scope-Pfade hart ablehnbar sind.
- keine geheimen, lokalen oder externen Pfade geschrieben werden muessen.

Blockiert, wenn:

- der Run unklare Cross-Repo-Writes braucht.
- der Auftrag Registry-, Deploy- oder Persona-Wahrheit direkt mutieren wuerde.
- ein Write-Pfad nicht durch Scope-Gates laufen kann.

### 3. Dependency-Risk Check

Frage: Haengt der Run an nicht geschnittenen oder Soulmatch-spezifischen Systemteilen?

Erlaubt, wenn:

- die benoetigten Donors in `BUILDER_DONOR_MAP.md` als sofort nutzbar stehen.
- adapterpflichtige Teile nur read-only oder explizit begrenzt genutzt werden.

Blockiert oder reviewpflichtig, wenn:

- Maya Context / Director / Chat als Runtime-Abhaengigkeit gebraucht wird.
- Builder Chat Fusion gebraucht wird.
- Render Integration gebraucht wird.
- AICOS direkt mutiert werden soll.

### 4. Runtime/Deploy-Risk Check

Frage: Kann der Run ohne Auto-Deploy, Render-Port oder produktive Runtime-Mutation abgeschlossen werden?

Erlaubt, wenn:

- der Run lokal oder in Builder-Evidence abschliessbar ist.
- Deploy nur als expliziter spaeterer Human-Gate-Schritt auftaucht.

Blockiert, wenn:

- Erfolg nur durch Auto-Deploy behauptet werden kann.
- Render-Service-Konfiguration geaendert werden muss.
- externe Produktionssysteme ohne Freigabe betroffen waeren.

### 5. Evidence-Availability Check

Frage: Kann der Run ein pruefbares Evidence Bundle erzeugen?

Erlaubt, wenn mindestens eine Evidence-Quelle realistisch erreichbar ist:

- Task Evidence.
- Task Artifacts.
- Task Audit.
- Bridge Audit.
- Tests oder andere pruefbare Outputs.

Blockiert, wenn:

- der Run nur Chat-Zusammenfassung produziert.
- keine Artefakte, Diffs, Logs oder Audit-Belege erwartbar sind.
- die Entscheidung spaeter nicht nachvollzogen werden kann.

### 6. Track-Independence Check

Frage: Duerfen mehrere Worker-Tracks parallel laufen?

Parallele Tracks sind nur erlaubt, wenn alle Bedingungen erfuellt sind:

1. Jeder Track hat einen eigenen, klaren Scope.
2. Die Tracks schreiben nicht dieselben Dateien.
3. Kein Track braucht das Ergebnis eines anderen Tracks, bevor er startet.
4. Die Evidence jedes Tracks ist separat pruefbar.
5. Ein gescheiterter Track kann verworfen werden, ohne erfolgreiche Tracks zu entwerten.
6. Kein Track beruehrt No-Go-Zonen.

Wenn eine Bedingung fehlt, ist nur `allow_single_track` erlaubt.

Wenn Scope-Konflikte oder Abhaengigkeiten wahrscheinlich sind, ist `require_human_review` erforderlich.

### 7. Human-Gate Check

Frage: Muss ein Mensch vor Ausfuehrung, Merge oder Promotion entscheiden?

Human Gate ist immer erforderlich bei:

- Merge.
- Deploy.
- Aenderung von Produktentscheidung oder Primacy.
- Scope mit mehreren Modulen.
- niedrigem Confidence Score.
- jeder Ausnahme von Standardpfaden.

Im MVP bleibt Human Gate auch nach erfolgreicher Evidence Pflicht.

### 8. Council-Trigger Check

Frage: Muss ein begrenzter Council vor Entscheidung oder Ausfuehrung eingeschaltet werden?

Council wird nur getriggert bei:

- Confidence unter definierter Schwelle.
- Agent-Fehler nach wiederholtem Retry.
- Architekturentscheidung mit Langzeitwirkung.
- Konflikt zwischen Phasenanforderungen.
- mehreren plausiblen Loesungswegen mit hohem Tradeoff.

Kein Trigger bedeutet kein Council.

## Outputs

Der Phase Scanner liefert ein strukturiertes Ergebnis:

```json
{
  "decision": "allow_single_track",
  "confidence": 0.82,
  "stoplight": "green",
  "allowed_tracks": [
    {
      "name": "single-builder-task",
      "scope": ["docs/example.md"],
      "requires_human_gate": true
    }
  ],
  "blocked_reasons": [],
  "required_evidence": ["task_evidence", "task_audit"],
  "human_gate_required": true,
  "council_required": false
}
```

## Decision Values

| Decision | Bedeutung |
|---|---|
| `allow_single_track` | Ein begrenzter Builder-Task darf angelegt werden |
| `allow_parallel_tracks` | Mehrere unabhaengige Tracks duerfen starten |
| `require_human_review` | Kein Run vor menschlicher Klaerung |
| `require_council` | Kein Run vor begrenztem Council |
| `reject` | Auftrag verletzt No-Go-Zonen oder ist nicht belegbar |

## Stoplight

| Stoplight | Bedeutung |
|---|---|
| `green` | klar begrenzt, Evidence erreichbar, keine No-Go-Zone |
| `yellow` | ausfuehrbar, aber Human Review vor oder nach Run erforderlich |
| `red` | blockiert, kein Builder Run |

## Fail-Verhalten

Wenn ein Check fehlschlaegt:

- Es wird kein Builder Run gestartet.
- Es wird kein Swarm gestartet.
- Es wird kein Write ausgefuehrt.
- Der Scanner erzeugt ein Review Bundle mit `blocked_reasons`.
- Bei klaerbarer Unsicherheit ist `require_human_review` zu waehlen.
- Bei Architektur-Tradeoff ist `require_council` zu waehlen.
- Bei No-Go-Verletzung ist `reject` zu waehlen.

## MVP-Regel

Im MVP darf der Phase Scanner nur drei Ausfuehrungsformen freigeben:

1. `allow_single_track`
2. `require_human_review`
3. `reject`

`allow_parallel_tracks` und `require_council` duerfen im MVP bereits als Output erscheinen, starten aber noch keine automatische Parallel- oder Council-Ausfuehrung.

## Nicht in v0

- Kein automatisches Scoring-Modell ohne spaeteren Benchmark.
- Kein Auto-Merge.
- Kein Auto-Deploy.
- Kein Render-Port.
- Kein Builder Chat Fusion.
- Kein AICOS-Write.
- Keine Maya-Write-Operation.
