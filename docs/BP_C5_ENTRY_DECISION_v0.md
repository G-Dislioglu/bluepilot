# BP-C5 Entry Decision v0

Datum: 2026-05-29
Status: BP-111 entry released
Phase: BP-C5 entry

## Entscheidung

BP-C5 Entry ist freigegeben.

BP-C5 ist die Integrationsphase. Sie darf nur vorhandene, gruene Bausteine zusammenfuehren und keine neue grosse Oberflaeche oder freien Runtime-Pfade erfinden.

## Entry Release Update

BP-110 Human Review ist abgeschlossen.

- Reviewer: Guercan
- Datum: 2026-05-29
- Decision: APPROVED
- Ergebnis: BP-C5 Integration darf unter eigenem WLP-Contract starten.

Diese Freigabe startet noch keinen BP-C5-Code. Sie erlaubt den naechsten BP-C5-Integrationsauftrag.

## BP-C5 darf aus BP-C4 integrieren

Erlaubt als wiederverwendbare technische Bausteine:

- `tools/difflens.cjs`
- `tools/browser-preview.cjs`
- `tools/browser-preview-smoke.cjs`
- `tools/browser-automation-smoke.cjs`
- `tools/browser-screenshot-check.cjs`

Erlaubte Evidence-Kette:

1. Diff wird zu DiffLens JSON.
2. DiffLens JSON wird zu HTML Preview.
3. HTML Preview wird per DOM Smoke geprueft.
4. HTML Preview wird in echtem Browser geladen.
5. Screenshot wird erzeugt und technisch validiert.

## BP-C5 darf aus frueheren Phasen integrieren

Erlaubt als Integrationsanker:

- Council Kernel aus BP-C1.
- Model Pool aus BP-C2.
- Context Broker aus BP-C2.
- Council Session Guard aus BP-C2.
- Parallel Executor aus BP-C3.
- Maya Memory aus BP-C3.
- AICOS Auto-query aus BP-C3.

Diese Bausteine duerfen nur ueber eigene BP-C5-Contracts verbunden werden.

## BP-C5 darf nicht integrieren

Nicht erlaubt ohne separaten Contract:

- freie Produkt-Web-UI,
- Accept-/Reject-/Merge-Workflow,
- Deploy,
- Push-/Merge-Automation,
- AICOS Write,
- Live-Builder-Mutation,
- Human UI Review Claim,
- ungegrenzter Council,
- Agent-Spawning mit echten Modellen,
- Secrets, Auth oder DB-Zugriff.

## CLI-only Grenzen

Folgende BP-C4-Tools bleiben zunaechst CLI-only:

- DiffLens,
- Browser Preview Generator,
- DOM Smoke,
- Browser Automation Smoke,
- Screenshot Check.

BP-C5 darf sie orchestrieren, aber nicht so tun, als seien sie bereits eine persistente Web-Oberflaeche.

## Human UI Review Gate

Human UI Review fuer BP-110 ist abgeschlossen und approved.

BP-C5 darf technische Integration bauen, solange sie keine neue Aussage trifft wie:

- UI ist menschlich freigegeben,
- Preview ist produktionsreif,
- menschliches Review fuer neue UI-Claims wurde erledigt.

Sobald BP-C5 eine neue user-facing UI-Readiness behauptet, muss vorher oder im selben Task ein Human UI Review Record fuer diesen neuen Claim vorliegen.

## Entry Criteria fuer ersten BP-C5-Slice

Der erste BP-C5-Slice muss:

- eigenen WLP-Contract haben,
- `council_session_required: true` setzen,
- BP-C5 als Integration, nicht Neubau, behandeln,
- genau eine Integrationsnaht verbinden,
- technische Evidence ausfuehren,
- Human UI Review nicht behaupten.

## Empfohlener erster BP-C5-Slice

BP-110 sollte ein lokaler Review Pipeline Orchestrator sein.

Ziel:

- vorhandene BP-C4-Tools in einem CLI-Befehl ausfuehren,
- JSON-Evidence, HTML Preview, DOM Smoke, Browser Smoke und Screenshot Check koordinieren,
- lokale Artefakte in einem explizit angegebenen Output-Verzeichnis schreiben,
- keine Artefakte committen,
- kein UI bauen.

Warum:

- Es integriert BP-C4 wirklich.
- Es bleibt kleiner als eine Web-UI.
- Es erzeugt eine klare Naht fuer spaetere UI-Integration.
- Es vermeidet BP-C5-Overbuild.

## BP-C5 Green Definition

BP-C5 ist nicht gruen, nur weil BP-C4 technisch gruen ist.

BP-C5 wird schrittweise gruen:

1. Pipeline Orchestrator gruen.
2. Council-/Context-Einbindung gruen.
3. Parallel-Executor-Einbindung gruen.
4. UI- oder Human-Gate nur mit eigenem Review Record.

## Fail-Verhalten

Wenn eine BP-C5-Integration eine fehlende Evidence-Stufe entdeckt:

- kein stilles Ueberspringen,
- JSON-Evidence mit Fail-Grund,
- Review Packet benennt die blockierende Stufe,
- kein BP-C5-Green-Claim.
