# Bluepilot Repo Decision

Datum: 2026-05-25
Status: canonical decision spec v0
Evidenzbasis: Bluepilot synthesis v0, Builder Ist-Zustand code-review-verified

## Entscheidung

Bluepilot wird als eigenes GitHub-Repo mit Donor-Adapter-Schicht angelegt.

```text
bluepilot = eigene Produktgrenze
builder/soulmatch = Donor fuer bestehende Build-Mechaniken
maya-core = Review-/Architect-/Companion-Surface
aicos-registry = Governance-/Pattern-/Card-Wahrheit
```

Bluepilot soll kein isolierter Neubau werden. Vorhandene Builder-, Maya- und AICOS-Faehigkeiten werden genutzt, aber nur ueber klare Adapter- oder API-Vertraege.

## Bewertete Alternativen

| Alternative | Bewertung | Hauptproblem |
|---|---|---|
| Eigenes Repo + Donor-Adapter | empfohlen | braucht anfangs Adapterdisziplin |
| Direkte Builder-Integration | nicht empfohlen | Bluepilot wuerde in Builder-Logik driften |
| AICOS-Subfolder | nicht empfohlen | AICOS ist Governance-/Card-/Pattern-Wahrheit, keine Runtime |
| Maya-Core-Subfolder | nicht empfohlen | Maya soll Review-/Architect-/Companion-Surface bleiben, nicht Bluepilot-Backend |

## Warum das eigene Repo gewinnt

- Bluepilot braucht eine sichtbare Produktgrenze.
- Builder soll Donor-System sein, nicht Bluepilot-Heimat.
- Maya soll Review- und Architect-Flaeche bleiben.
- AICOS soll Wahrheit und Governance liefern, aber nicht direkt mutiert oder zur Runtime gemacht werden.
- Die Builder-Ist-Zustandsliste zeigt, dass viele benoetigte Bausteine bereits ohne Soulmatch-Abhaengigkeit existieren.
- Adapter schuetzen vor stiller Kopplung an Soulmatch-spezifische Persona-, Render- oder Chat-Fusion-Pfade.

## Zielbild

```text
bluepilot/
  docs/
```

In dieser Phase enthaelt das Repo bewusst nur Dokumentation. Code, `src/`, `package.json` und Runtime-Struktur folgen erst nach bestaetigten Adapter-Vertraegen.

## Entscheidungssatz

Bluepilot wird als eigenes Produkt-Repo aufgebaut und nutzt Builder, Maya und AICOS als Donor-Systeme ueber explizite Adaptervertraege.
