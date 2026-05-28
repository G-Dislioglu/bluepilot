# Phase Scanner Runtime Decision v0

Datum: 2026-05-28
Status: BP-001 governance decision
Gilt fuer: erster Phase-Scanner-MVP vor Builder-Run-Erzeugung
Referenzen: `docs/PHASE_SCANNER_SPEC_v0.md`, `docs/OPEN_QUESTIONS.md`, `docs/NO_GO_ZONES.md`, `docs/WORKCELL_LOCK_PROTOCOL.md`

## Entscheidung

Phase Scanner v0 wird als Hybrid ausgefuehrt:

- Deterministischer Kern fuer Gates, Scope, Evidence, Schema und Fail-Verhalten.
- LLM-gestuetzte Assistenz nur fuer Begruendung, Risk Summary und Track-Split-Empfehlung.

Ein LLM darf harte Gates nicht aufweichen, ueberschreiben oder nachtraeglich als "gelb" umdeuten. Wenn deterministische und LLM-gestuetzte Bewertung kollidieren, gewinnt der deterministische Gate-Status.

## 1. Confidence

`confidence` ist keine Phantomzahl und wird nicht frei vom LLM gesetzt.

Im MVP wird `confidence` aus sichtbaren Check-Ergebnissen berechnet. Jeder Check liefert einen Status:

| Status | Wert |
|---|---:|
| `pass` | 1.0 |
| `review` | 0.5 |
| `fail` | 0.0 |
| `unknown` | 0.25 |

MVP-Checks:

- Scope-Clarity Check.
- File-Risk Check.
- Dependency-Risk Check.
- Runtime/Deploy-Risk Check.
- Evidence-Availability Check.
- Track-Independence Check.
- Human-Gate Check.
- Council-Trigger Check.
- Known-Risks Check.
- No-Go-Zones Check.

Berechnungsregel:

```text
confidence = average(check_values), rounded to two decimals
```

Harte Overrides:

- Jede No-Go-Verletzung setzt `decision = reject`, `stoplight = red`, `confidence <= 0.30`.
- Fehlende Evidence-Verfuegbarkeit setzt `decision = reject`, `stoplight = red`, `confidence <= 0.40`.
- Unklarer Write-Scope setzt mindestens `decision = require_human_review`, `stoplight = yellow`, `confidence <= 0.60`.
- Niedrige oder widerspruechliche Eingabequalitaet setzt mindestens `decision = require_human_review`.

Stoplight-Schwellen ohne Override:

| Confidence | Stoplight |
|---:|---|
| `>= 0.80` | `green` |
| `>= 0.55` und `< 0.80` | `yellow` |
| `< 0.55` | `red` |

## 2. `known_risks`

`known_risks` ist ein expliziter MVP-Input und darf nicht ignoriert werden.

Der Scanner fuehrt dafuer einen eigenen Known-Risks Check ein und spiegelt Risiken zusaetzlich in den passenden bestehenden Checks:

| Risikoart | Primaerer Check | Erlaubtes MVP-Verhalten |
|---|---|---|
| Drift | Scope-Clarity, File-Risk | `required_evidence` erweitern oder Human Gate verlangen |
| Runtime | Runtime/Deploy-Risk | Human Gate oder Reject bei produktiver Mutation |
| Deploy | Runtime/Deploy-Risk | Reject, wenn Erfolg Auto-Deploy braucht |
| Produktentscheidung | Human-Gate, Council-Trigger | Human Review; Council nur als Output, keine Auto-Ausfuehrung |
| Daten/Auth/Secrets | File-Risk, No-Go-Zones | Reject bei Write oder unsicherer Freigabe |
| Kosten/externes System | Runtime/Deploy-Risk | Human Review oder Reject |

MVP-Regel:

- Leeres `known_risks` ist erlaubt, wenn der Scanner `known_risks_status = "not_provided"` ausgibt.
- Gelieferte Risiken muessen in mindestens einem dieser Felder sichtbar werden: `blocked_reasons`, `required_evidence`, `human_gate_required`, `risk_summary`.
- Ein geliefertes Risiko ohne sichtbare Wirkung ist ein Scanner-Fehler.

## 3. Ausfuehrung

Der Phase Scanner v0 wird zuerst als lokales deterministisches Tool ausgefuehrt. Ein spaeterer LLM-Schritt darf nur auf dem deterministischen Ergebnis aufsetzen.

MVP-Ablauf:

1. Inputs laden und Output-Schema validieren.
2. No-Go-Zonen, Scope, required evidence und bekannte harte Verbote deterministisch pruefen.
3. Check-Statuswerte und Confidence deterministisch berechnen.
4. Decision, stoplight und Fail-Verhalten deterministisch ableiten.
5. Optional: LLM-gestuetzte Begruendung, Risk Summary und Track-Split-Empfehlung erzeugen.
6. Optionalen LLM-Output gegen das deterministische Ergebnis validieren.

Wenn der optionale LLM-Schritt fehlt, fehlschlaegt oder widerspricht, bleibt der deterministische Output gueltig.

## 4. Harte deterministische Gates

Folgende Teile sind harte Gates:

- No-Go-Zonen.
- `forbidden_files`.
- `allowed_files` / Scope-Gates.
- Required Evidence je Task-Typ.
- `known_risks`-Praesenz und sichtbare Verarbeitung.
- Output-Schema-Validierung.
- MVP-Decision-Set.
- Fail-Verhalten bei `reject`.
- Verbot von Auto-Merge, Auto-Deploy, AICOS-Write, Maya-Write und Builder Chat Fusion.

Diese Gates koennen nur durch eine neue dokumentierte Governance-Entscheidung geaendert werden.

## 5. LLM-gestuetzte Teile

LLM-Unterstuetzung ist im MVP erlaubt fuer:

- Kurzbegruendung pro Check.
- Risk Summary in Nutzersprache.
- Track-Split-Empfehlung.
- Hinweise, welche Eingabe fuer Human Review fehlt.
- Vorschlag fuer `blocked_reasons`, solange deterministische Gates sie validieren.

LLM-Unterstuetzung ist im MVP nicht erlaubt fuer:

- Setzen oder Ueberschreiben von `confidence`.
- Ueberschreiben harter Gates.
- Freigeben von Parallel-Tracks.
- Freigeben von Deploy, Merge oder produktiver Mutation.
- Erfinden nicht gelesener Repo-Fakten.

## 6. MVP-pflichtige Outputs

Der Phase Scanner v0 muss mindestens diese Felder ausgeben:

```json
{
  "decision": "allow_single_track",
  "confidence": 0.82,
  "stoplight": "green",
  "check_results": [
    {
      "name": "scope_clarity",
      "status": "pass",
      "reason": "Goal and evidence are bounded."
    }
  ],
  "known_risks_status": "processed",
  "risk_summary": [],
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

MVP-erlaubte `decision`-Werte:

- `allow_single_track`
- `require_human_review`
- `reject`

`allow_parallel_tracks` und `require_council` duerfen in Spezifikationen als Zukunftswerte bestehen, starten im MVP aber keine automatische Ausfuehrung. Wenn sie als Empfehlung entstehen, wird fuer die Runtime `require_human_review` ausgegeben und die Empfehlung in `risk_summary` oder `blocked_reasons` erklaert.

## 7. Fail-Verhalten

Bei `reject`:

- Kein Builder Run.
- Kein Swarm.
- Kein Write.
- Kein Deploy.
- Kein Merge.
- Output enthaelt `blocked_reasons` und die fehlgeschlagenen `check_results`.

Bei `require_human_review`:

- Kein automatischer Run.
- Output benennt fehlende Klaerung, betroffene Risiken und required evidence.
- Human Gate bleibt Pflicht, auch wenn Confidence im gelben Bereich liegt.

Bei optionalem LLM-Fehler:

- Deterministischer Output bleibt die Quelle der Wahrheit.
- `risk_summary` darf leer oder als `llm_unavailable` markiert sein.
- Harte Gates bleiben gueltig.

## Konsequenz fuer BP-002/BP-003

BP-002 kann den bestehenden WLP-Verifier gegen Contract-Felder haerten.

BP-003 kann `tools/phase-scanner.cjs` als deterministischen MVP bauen, ohne LLM-Integration vorauszusetzen. Eine spaetere LLM-Erweiterung muss den deterministischen Output als unveraenderbare Basis behandeln.
