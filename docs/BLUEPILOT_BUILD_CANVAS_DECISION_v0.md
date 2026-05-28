# Bluepilot Build Canvas Decision v0

Datum: 2026-05-28
Status: BP-084 governance decision
Quelle: `C:/Users/guerc/Downloads/bluepilot_build_canvas.svg`

Diese Entscheidung uebersetzt den gelieferten Bluepilot Build Canvas in die aktuelle Repo-Linie.

Wichtig: Der Canvas wird nicht als alter `BP-C0`-Bootstrap blind uebernommen. Bluepilot steht im Repo bereits deutlich weiter. Der Canvas ist ab jetzt eine Reihenfolge- und Abhaengigkeitsquelle fuer die naechste Council-Kernel-Linie.

## Harte Regeln

### 1. Reihenfolge ist absolut

Die Phasen laufen nur in dieser Reihenfolge:

```text
BP-C0 Governance Docs
-> BP-C1 Council Kernel
-> BP-C2 Parallel Phase: Multi-model Pool, Context Broker, WLP Tooling
-> BP-C3 Parallel Phase: Parallel Executor, Maya Memory, AICOS Auto-query
-> BP-C4 Visual Phase: DiffLens, Browser Preview
-> BP-C5 Integration Phase: Web UI, Remote Control, GOAT Bridge
```

Kein Modul aus BP-C2 bis BP-C5 darf starten, bevor alle vorherigen Phasen gruen sind.

### 2. BP-C1 ist das naechste harte Gate

BP-C1 muss fertig, verifiziert und reviewed sein, bevor BP-C2 startet.

BP-C1 baut den Council Kernel:

- `maya-council-watcher`
- `council-agent-client`
- `.bluepilot/council/session.json`
- `.bluepilot/council/agents/`
- `.bluepilot/council/events.jsonl`
- `.bluepilot/council/dedup.json`

Vor BP-C1 darf es keine echte Parallel-Agent-Orchestrierung geben.

### 3. Parallel bedeutet nur innerhalb einer Phase

BP-C2 kann drei parallele Agenten haben:

- Multi-model Pool,
- Context Broker,
- WLP Tooling.

Diese drei Agenten starten aber erst, wenn BP-C1 gruen ist.

BP-C3 kann ebenfalls drei parallele Agenten haben:

- Parallel Executor,
- Maya Memory,
- AICOS Auto-query.

Diese drei Agenten starten erst, wenn BP-C2 gruen ist.

Parallelitaet ueberspringt keine Phase.

### 4. Council Session Wrapper ist Pflicht ab BP-C1

Die gestrichelte Canvas-Linie bedeutet:

```text
Ab BP-C1 laufen alle folgenden Agents unter aktiver Council Session.
```

Kein Agent in BP-C2 bis BP-C5 startet ohne aktiven Council Kernel.

Maya orchestriert:

- Assignments,
- Status,
- HARD STOP Broadcasts,
- Context Deltas,
- Deduplication,
- Session Close.

### 5. BP-C5 ist Integration, kein eigenes Build

BP-C5 baut nicht isoliert neue Grundfaehigkeiten.

BP-C5 integriert fertige Vorphasen:

| BP-C5 Modul | Braucht vorher |
|---|---|
| Web UI | Context Broker |
| Remote Control | Council Kernel |
| GOAT Bridge | Parallel Executor |

Wenn eine Abhaengigkeit fehlt, ist BP-C5 blockiert.

## Modul-Prompt-Map

Der Canvas enthaelt klickbare Module. Fuer Repo-Arbeit werden diese Klick-Prompts als Prompt-Map dokumentiert:

| Modul | Prompt-Frage |
|---|---|
| BP-C0 Governance Docs | What is in BP-C0 governance docs? |
| BP-C1 Council Kernel | What exactly does BP-C1 Council Kernel build? |
| BP-C2 Multi-model Pool | What does the multi-model pool build in BP-C2? |
| BP-C2 Context Broker | What does the context broker build in BP-C2? |
| BP-C2 WLP Tooling | What does WLP tooling build in BP-C2? |
| BP-C3 Parallel Executor | What does the parallel executor build in BP-C3? |
| BP-C3 Maya Memory | What does Maya memory build in BP-C3? |
| BP-C3 AICOS Auto-query | What does AICOS auto-query build in BP-C3? |
| BP-C4 DiffLens | What does DiffLens build in BP-C4? |
| BP-C4 Browser Preview | What does browser preview build in BP-C4? |
| BP-C5 Web UI | What does Web UI build in BP-C5? |
| BP-C5 Remote Control | What does remote control build in BP-C5? |
| BP-C5 GOAT Bridge | What does GOAT bridge build in BP-C5? |

Wenn Codex zu einem Modul Kontext braucht, soll Codex zuerst die passende Prompt-Frage beantworten und daraus einen WLP-Task ableiten.

## Korrektur gegenueber externem BP-C0-Paket

Nicht blind uebernehmen:

- `BP-C0` als neuer Bootstrap-Start,
- `contracts/reviews/` als neue Review-Packet-Konvention,
- ungepruefte `.specify`-Ueberschreibungen,
- Encoding-beschaedigte Texte,
- Runtime-Dateien aus dem Handover,
- direkte Soulmatch- oder AICOS-Mutationen.

Uebernehmbar als Richtung:

- Produktziel konkretisieren,
- Feature-Phasen auf Council Kernel ausrichten,
- Council Session Protocol v1.1 als relevante Spezifikation pruefen,
- Donor-Pattern nicht kopieren, sondern adaptieren.

## Naechster Schritt

BP-085 sollte `.specify/.app-goal.md` und `.specify/.feature-goals.md` aus dem Platzhalterzustand holen und an diese Canvas-Reihenfolge binden.

BP-085 darf noch keine Runtime bauen.
