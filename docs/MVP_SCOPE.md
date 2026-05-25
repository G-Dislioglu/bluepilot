# Bluepilot MVP Scope

Datum: 2026-05-25
Status: MVP scope v0
Evidenzbasis: Bluepilot synthesis v0, Builder Donor Map v0

## MVP-Kette

Der erste Bluepilot-MVP beweist nur diese Kette:

```text
Idea
  -> Phase Scanner
  -> Scope Resolver
  -> Task Create
  -> Execute
  -> Observe
  -> Evidence Bundle
  -> Maya Review
  -> Human Gate
```

## Im MVP

| Schritt | Zweck | Donor / Quelle |
|---|---|---|
| Idea | Eingang einer Bauidee | Bluepilot Intake-Form oder bestehender Intake-Kanal |
| Phase Scanner | prueft Risiko, Abhaengigkeiten und sichere Track-Grenzen | Bluepilot neu, auf Builder-Kontext gestuetzt |
| Scope Resolver | bestimmt erlaubte Dateien und blockt Out-of-Scope-Writes | Builder `builderScopeResolver.ts` |
| Task Create | legt einen Builder-Task an | Builder Task CRUD |
| Execute | startet die Ausfuehrung | Opus Bridge Execute |
| Observe | beobachtet laufenden oder abgeschlossenen Job | Opus Bridge Observe / Async Jobs |
| Evidence Bundle | sammelt Ergebnis, Artefakte, Audit und Tests | Builder Evidence Bundle / Artifacts / Audit |
| Maya Review | legt Entscheidungsmaterial vor | Maya als Review-/Architect-Flaeche, noch ohne tiefe Adapterdetails |
| Human Gate | Freigabe, Verwurf oder Ruecknahme | Builder Approve / Discard / Revert |

## Explizit nicht im MVP

- Kein kompletter autonomer App-Builder.
- Kein Auto-Merge.
- Kein Auto-Deploy.
- Kein Render-Port.
- Kein Builder Chat Fusion.
- Kein freier Maya Chat aus Builder.
- Kein freier Council ohne Trigger.
- Kein Desktop-Bridge-Write.
- Keine direkte Mutation von AICOS-Registry-Wahrheit.
- Keine unbegrenzten parallelen Worker-Tracks.
- Keine automatische Patrol-Reparatur.

## MVP-Erfolgskriterium

Ein MVP-Run ist erfolgreich, wenn aus einer Idee ein begrenzter Builder-Task entsteht, sicher ausgefuehrt wird, ein Evidence Bundle erzeugt und Maya/Gurcan zur Entscheidung vorgelegt wird.

## Nicht-Erfolgskriterium

Ein Run zaehlt nicht als erfolgreich, wenn Bluepilot nur Aktivitaet erzeugt, aber kein pruefbares Evidence Bundle und keine klare menschliche Freigabeentscheidung liefert.
