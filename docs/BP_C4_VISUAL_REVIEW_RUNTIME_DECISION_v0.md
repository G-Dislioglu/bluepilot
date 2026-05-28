# BP-C4 Visual Review Runtime Decision v0

Datum: 2026-05-28
Status: BP-099 decision
Phase: BP-C4

## Entscheidung

BP-C4 startet nicht mit einer grossen UI.

BP-C4 startet mit einer sicheren Visual-Review-Grundlage:

- DiffLens erzeugt zuerst lokale Evidence aus Diffs.
- Browser Preview bleibt ein spaeterer Slice, bis ein konkreter lokaler Preview-Target existiert.
- UI-Claims brauchen echte Screenshot-, Playwright- und Human-Review-Evidence.
- BP-C5 bleibt blockiert, bis DiffLens und Browser Preview gruen sind.

## Warum

Das Repo hat bereits Council, Context, Model Routing, Worktree-Foundation, Memory und AICOS Query.

Was fehlt, ist noch keine Produkt-UI, sondern eine belastbare Review-Oberflaeche fuer Aenderungen:

- Welche Dateien wurden veraendert?
- Welche Diffs sind riskant?
- Welche Aenderungen brauchen menschliche visuelle Pruefung?
- Welche Evidence fehlt noch?

Eine UI ohne diese Grundlage waere Scheinfortschritt.

## DiffLens v0

DiffLens v0 darf:

- Unified Diffs lesen.
- Dateien, Hunks, Additions und Deletions zusammenfassen.
- offensichtliche Risiko-Pfade markieren.
- Binary- oder Lockfile-Aenderungen sichtbar machen.
- ein maschinenlesbares JSON-Ergebnis ausgeben.
- Human-Review-Gates benennen.

DiffLens v0 darf nicht:

- Git-History veraendern.
- Aenderungen akzeptieren oder verwerfen.
- Browser starten.
- BP-C5-Integration simulieren.
- UI-Review als erledigt markieren.

## Browser Preview v0

Browser Preview v0 darf erst starten, wenn ein lokales Preview-Ziel klar ist.

Erforderlich vor Browser Preview:

- ein konkreter lokaler URL- oder Datei-Target,
- klare Zielpersona,
- Screenshot-Check,
- Playwright-Flow oder gleichwertige Browser-Automation,
- Human UI Review Packet.

Ohne diese Punkte bleibt Browser Preview nur vorbereitet, nicht gebaut.

## Harte Gates

Deterministische Gates:

- BP-C4-Tasks brauchen eigenen WLP-Contract.
- BP-C4-Tasks brauchen eigenes Review Packet.
- `council_session_required` bleibt true.
- UI-Tasks brauchen `target_persona`.
- Browser-/Screenshot-Evidence darf nicht behauptet werden, wenn sie nicht erzeugt wurde.
- Kein Deploy.
- Kein Merge.
- Kein BP-C5.

LLM-gestuetzt erlaubt:

- Risiko-Zusammenfassung.
- Review-Hinweise.
- Vorschlag, ob Browser Preview noetig ist.

LLM-gestuetzt nicht erlaubt:

- Akzeptieren von Diffs.
- Ueberschreiben von WLP-Gates.
- Ersetzen echter Screenshot- oder Test-Evidence.

## Fail-Verhalten

Wenn DiffLens keinen Diff lesen kann:

- exit code 1,
- klare Fehlermeldung,
- keine Datei wird veraendert.

Wenn DiffLens riskante Pfade erkennt:

- kein automatischer Abbruch,
- aber `human_gate_required: true`.

Wenn UI-Evidence fehlt:

- Task darf nicht als UI-gruen markiert werden.

## BP-C5 Blocker

BP-C5 darf nicht starten, solange eine der folgenden Aussagen wahr ist:

- DiffLens erzeugt noch keine stabile Evidence.
- Browser Preview hat keinen echten lokalen Target-Smoke.
- Human UI Review ist nur behauptet.
- Context Broker, Council Kernel oder Parallel Executor werden nur indirekt vorausgesetzt, aber nicht im Integrationspfad geprueft.

## Naechster Schritt

Der naechste sichere Slice ist ein kleines DiffLens-CLI:

- Input: Unified Diff aus Datei oder stdin.
- Output: JSON Summary.
- Keine Git-Mutation.
- Keine UI.
- Kein Browser.
