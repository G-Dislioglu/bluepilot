# BP-C4 Browser Preview Readiness v0

Datum: 2026-05-28
Status: BP-101 readiness
Phase: BP-C4

## Entscheidung

Der erste Browser-Preview-Target ist kein App-Server.

Der erste sichere Target ist eine statische lokale HTML-Datei, die aus DiffLens-JSON erzeugt wird.

## Warum

Bluepilot hat aktuell Tools und Governance, aber noch keine Produkt-Web-UI.

Ein App-Server oder UI-Shell waere fuer BP-C4 zu gross und wuerde BP-C5 vorwegnehmen. Eine statische HTML-Preview ist dagegen klein, lokal, deterministisch und ohne neue Dependency testbar.

## Erlaubt

Ein Browser-Preview-Slice darf:

- DiffLens JSON lesen,
- eine lokale HTML-Datei erzeugen,
- Risk Flags, Dateien und Summary sichtbar machen,
- ein Preview-Manifest ausgeben,
- keine Git-Mutation ausloesen.

## Nicht erlaubt

Der Slice darf nicht:

- einen Dev-Server starten,
- ein Web-App-Framework einfuehren,
- Screenshot-Evidence behaupten, wenn kein Browserlauf stattgefunden hat,
- Human UI Review behaupten,
- BP-C5-Integration starten.

## Evidence-Grenze

Eine erzeugte HTML-Datei zaehlt als:

- lokaler Preview Target,
- strukturelle Browser-Preview-Vorbereitung.

Sie zaehlt nicht als:

- Screenshot Check,
- Playwright Flow,
- Human UI Review,
- BP-C4 komplett gruen.

## Naechster Schritt

BP-102 soll einen kleinen HTML-Preview-Generator bauen:

- Input: DiffLens JSON.
- Output: HTML Preview und optional Manifest.
- Tests: HTML enthaelt Summary, Files, Risk Flags und escaped User Content.
