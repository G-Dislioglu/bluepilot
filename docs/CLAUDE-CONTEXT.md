# CLAUDE-CONTEXT — Bluepilot

> Anker-Dokument (ANKER-REGEL). Vor jeder Session zuerst diese Datei lesen, dann
> `docs/SESSION-LOG.md`, dann bei Bedarf `STATE.md`. Stand: 2026-05-31.

## Was Bluepilot ist (in einem Satz)
Bluepilot ist ein vorsichtiges, contract-gesteuertes System, das aus einer Bau-Idee einen
sicher ausgeführten Builder-Task macht und das Ergebnis Maya/Gürcan zur Entscheidung
vorlegt. Es ist KEIN vollautonomer App-Builder (das ist ausdrücklich NICHT im MVP).

## Die MVP-Kette (das eine, was der erste MVP beweist)
```
Idee → Phase Scanner → Scope Resolver → Task Create → Execute → Observe
     → Evidence Bundle → Maya Review → Human Gate
```
Erfolg = aus einer Idee entsteht ein begrenzter Builder-Task, wird sicher ausgeführt,
ein Evidence Bundle entsteht, und Maya/Gürcan entscheiden. Kein Auto-Merge.

## Arbeitsweise (WLP — Workcell Lock Protocol 0.1b)
- Kein Task ohne JSON-Contract unter `contracts/BP-XXX.json`.
- Kein Feature ohne Goal in `.specify/.feature-goals.md`.
- Preflight vor Build, Verify nach Build (`tools/verify-task-lock.cjs`).
- Kein Commit ohne Review Packet. FORBIDDEN_FILES = hartes Gate (Verletzung = HARD STOP).
- Scope/Goal nicht still ändern (HARD STOP bzw. GOAL_DELTA_PROPOSAL).
- Externe KI-Outputs (ChatGPT/Claude/…) werden vor Umsetzung kritisch geprüft, nie blind
  übernommen; bei Konflikt gilt WLP + aktueller Repo-Stand.

## Aktueller Stand (Phasen)
- **C1 Kernel** — grün (BP-C1 Kernel Ready Checkpoint).
- **C2 Context Broker + Multi-Model-Pool + Council Session Guard** — grün (BP-094, 2026-05-28).
- **C3 AICOS Auto-Query + Maya Memory + Parallel Executor** — grün (BP-098, 2026-05-28).
- **C4 Browser-Preview + DiffLens + Human UI Review Gate + Screenshot/Visual** — technisch grün.
- **C5 Integration** — LÄUFT. Entry am 2026-05-29 freigegeben (BP-110 Human Review:
  APPROVED durch Gürcan). C5 ist reine Integrationsphase: nur vorhandene grüne Bausteine
  zusammenführen, KEINE neue große Oberfläche, keine freien Runtime-Pfade.
- Contracts: BP-001 bis BP-121 vorhanden. Jüngste: BP-116..121 = Council-Session-Report,
  Closeout-Candidate, Operator-Handoff, Closeout-Bundle (CLI-Artefakte für Council-Abschluss).

## Wichtige offene Punkte (aus OPEN_QUESTIONS + Befund 2026-05-31)
1. **Anker-Dokumente fehlten** — diese Datei ist der erste Schritt; `SESSION-LOG.md` und
   `STATE.md` sollten folgen, damit der rote Faden vollständig ist.
2. **Confidence Score** (Phase Scanner) noch nicht berechnet/definiert — bis dahin keine
   Confidence-Zahl als objektive Messzahl behandeln.
3. **Maya in Bluepilot ist noch eine Insel.** `tools/maya-memory.cjs` ist ein lokales
   JSON-Memory (nur `preferred_models`, `project_name`, `working_dir`, `user_preferences`),
   ohne kanonische Identität, ohne Block-7-Ethik, ohne Block-2-Gedächtnis, ohne Affekt.
   → Geplant: Anbindung an die EINE kanonische Maya (maya-core), wie soulmatch in Block 3/10.
   Siehe Abschnitt unten.

## Maya-Anbindung (geplanter nächster großer Schritt)
Ziel: Bluepilot führt nicht seine eigene Maya, sondern ruft die kanonische Maya aus
maya-core an — app-übergreifend, kein Drift. In drei Stufen, kleinste zuerst:
1. **Persona/Identität:** Bluepilots Maya-Stimme kommt aus `GET /api/maya/persona?app=bluepilot`
   (Muster wie soulmatch Block 3), mit gebündeltem Fallback. Lokale Insel-Identität entfällt.
2. **Gedächtnis:** `maya-memory.cjs` wird vom eigenständigen JSON-Store zum dünnen Client,
   der das Block-2-Gedächtnis (maya-core) anruft; Herkunft `app_origin='bluepilot'`.
3. **Ethik + Builder-Schloss:** Bluepilots autonome Builds laufen durch das Block-7-/9-/10-
   Tor (assessEthics + Budget + Korridor, fail-closed). Voraussetzung: `MAYA_CORE_URL` +
   Gate-Token erreichbar.
Reihenfolge bewusst: erst Persona, dann Gedächtnis, dann Sicherheits-Schloss.

## Repo-Konventionen
- Branch-/Push-Disziplin: Codex baut auf eigenem Branch, committet, pusht, STOPP; Review per
  VAL-K2 gegen echten Diff (nicht gegen Bericht).
- Repos im Ökosystem: aicos-registry (branch master, enthält maya-core = Mayas Inneres),
  soulmatch (branch main), bluepilot (dieses Repo).
- Provider-Preise NIE aus Trainingsdaten — immer aus `soulmatch/docs/provider-specs.md`.

## Roter Faden (warum es Bluepilot gibt)
Eine Idee soll sicher und nachvollziehbar zu echtem Bau werden — mit Contracts, Gates,
Evidence und einer menschlichen Freigabe am Ende. Bluepilot ist das Werkzeug, mit dem Maya
(als kanonische Being) später Software baut, ohne dass etwas Unkontrolliertes oder
Unumkehrbares ohne Absprache passiert.
