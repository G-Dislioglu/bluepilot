# Bluepilot Open Questions

Datum: 2026-05-25
Status: phase-0 open questions
Evidenzbasis: Review der Phase-0-Dokumente bis `PHASE_SCANNER_SPEC_v0.md`

Diese Datei sammelt offene Punkte, die fuer den ersten Build relevant sind, aber in Phase 0 noch nicht geloest werden sollen.

## 1. Confidence Score

`PHASE_SCANNER_SPEC_v0.md` nutzt `confidence` im Output, definiert aber noch keine Berechnung.

Offen:

- Welche Check-Ergebnisse fliessen in den Score ein?
- Ist der Score deterministisch, LLM-basiert oder hybrid?
- Welche Schwellen trennen `green`, `yellow` und `red`?
- Darf ein LLM eine Zahl setzen, oder muss der Score aus sichtbaren Faktoren berechnet werden?

Arbeitsregel bis zur Klaerung:

- Confidence darf nicht als objektive Messzahl behandelt werden.
- Jede Confidence-Zahl braucht spaeter eine nachvollziehbare Begruendung oder Berechnungsregel.

## 2. Verwendung von `known_risks`

`PHASE_SCANNER_SPEC_v0.md` listet `known_risks` als Input, referenziert den Input aber noch nicht ausdruecklich in den Checks.

Offen:

- Werden `known_risks` in einen eigenen Risk Check ueberfuehrt?
- Oder wirken sie als Modifikator auf Scope, Dependency, Runtime und Human-Gate Checks?
- Welche Risikoarten sind fuer MVP erlaubt: Drift, Runtime, Deploy, Produktentscheidung, Daten, Kosten?

Arbeitsregel bis zur Klaerung:

- `known_risks` duerfen nicht ignoriert werden.
- Wenn Risiken geliefert werden, muss der Scanner sie mindestens in `blocked_reasons`, `required_evidence` oder `human_gate_required` sichtbar machen.

## 3. Ausfuehrungsform des Phase Scanners

Noch offen ist, wer oder was den Phase Scanner ausfuehrt.

Moegliche Formen:

- deterministischer Code,
- LLM-Call mit Prompt-Vertrag,
- hybride Form aus deterministischen Checks und LLM-Begruendung.

Offen:

- Welche Checks muessen deterministisch sein?
- Welche Checks duerfen LLM-gestuetzt sein?
- Welcher Prompt- oder Output-Vertrag ist noetig, falls ein LLM beteiligt ist?
- Wie wird verhindert, dass ein LLM No-Go-Zonen weich formuliert statt blockiert?

Arbeitsregel bis zur Klaerung:

- No-Go-Zonen und Scope-Gates muessen hart und nachvollziehbar bleiben.
- LLM-Begruendung darf harte Gates nicht ueberschreiben.

## 4. Independence Check als kanonische Referenz

`ADAPTER_CONTRACTS_v0.md` und `BUILDER_DONOR_MAP.md` verwenden den Begriff Independence Check. Seit `PHASE_SCANNER_SPEC_v0.md` ist er dort konkret definiert.

Offen:

- Sollen die aelteren Docs explizit auf `PHASE_SCANNER_SPEC_v0.md` als kanonische Definition verweisen?
- Oder bleibt die Definition nur in der Phase-Scanner-Spec?

Arbeitsregel bis zur Klaerung:

- Die Definition in `PHASE_SCANNER_SPEC_v0.md` gilt als aktuelle Arbeitsreferenz.

## 5. Prozessregeln in `NO_GO_ZONES.md`

`NO_GO_ZONES.md` enthaelt neben Architektur-Guardrails auch Prozessregeln, zum Beispiel keine Modellannahmen ohne Benchmark und keine "implemented"-Behauptung ohne Repo-Beleg.

Offen:

- Bleiben diese Regeln bewusst in `NO_GO_ZONES.md`, weil sie Phase-0-Drift verhindern?
- Oder werden sie spaeter in ein `AGENTS.md` oder ein separates Arbeitsprotokoll verschoben?

Arbeitsregel bis zur Klaerung:

- Die Regeln bleiben gueltig.
- Eine Verschiebung darf ihre Verbindlichkeit nicht abschwaechen.
