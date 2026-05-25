# Bluepilot No-Go Zones

Datum: 2026-05-25
Status: guardrails v0
Evidenzbasis: Bluepilot synthesis v0, Builder Donor Map v0

Diese Grenzen gelten fuer Phase 0 und MVP. Sie verhindern, dass Bluepilot unbemerkt zu einer zweiten grossen Orchestrierungs-Engine oder zu einer tiefen Builder-Integration driftet.

## Harte No-Go-Zonen

| No-Go | Grund |
|---|---|
| Kein Auto-Merge | Merge und finale Freigabe bleiben beim Menschen |
| Kein Auto-Deploy | Deployments brauchen ausdrueckliche Freigabe |
| Kein Render-Port | Builder Render Integration ist Soulmatch-Service-ID-gebunden |
| Kein Builder Chat Fusion | arcana/persona-Schemas und Maya-Chat-Seite sind Soulmatch-gebunden |
| Kein freier Council ohne Trigger | Council braucht klare Trigger, Budget-Gates und Ende |
| Keine AICOS-Mutation | AICOS liefert Governance-/Card-/Pattern-Wahrheit, wird aber nicht direkt mutiert |
| Kein Maya-Write im MVP | Maya ist Review-/Architect-Flaeche, nicht Bluepilot-Backend |
| Kein Desktop-Bridge-Write im MVP | Desktop Bridge ist spaeterer Evidence-/Entscheidungskanal, nicht MVP-Write-Pfad |
| Keine unbegrenzten Worker-Tracks | Parallele Tracks nur nach Phase Scanner und Independence Check |
| Keine automatische Patrol-Reparatur | Patrol Findings hoechstens read-only nutzen |
| Keine Modellannahmen ohne Benchmark | Modellrouting darf nicht auf Fantasie beruhen |
| Keine "implemented"-Behauptung ohne Repo-Beleg | Spec, Plan und Umsetzung bleiben strikt getrennt |

## Council-Regel

Council darf nur starten, wenn ein Trigger vorliegt, zum Beispiel:

- Confidence unter definierter Schwelle.
- Agent-Fehler nach wiederholtem Retry.
- Architekturentscheidung mit Langzeitwirkung.
- Konflikt zwischen Phasenanforderungen.

Council diskutiert nicht endlos. Maya entscheidet nach begrenzter Beratung, und der Mensch bleibt Freigabeinstanz.

## Write-Regel

Jeder Write-Pfad braucht vor Ausfuehrung:

1. Scope-Pruefung.
2. Audit-Eintrag.
3. Evidence-Pfad.
4. Menschliches Gate, solange MVP/Phase 1 gilt.
