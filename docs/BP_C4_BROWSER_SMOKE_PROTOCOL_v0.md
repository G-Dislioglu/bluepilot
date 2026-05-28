# BP-C4 Browser Smoke Protocol v0

Datum: 2026-05-28
Status: BP-103 protocol
Phase: BP-C4

## Entscheidung

BP-C4 trennt vier Smoke- und Review-Stufen:

1. DOM Smoke
2. Browser Automation Smoke
3. Screenshot Check
4. Human UI Review

Keine Stufe darf als eine andere ausgegeben werden.

## Stufe 1: DOM Smoke

DOM Smoke prueft eine erzeugte HTML-Datei ohne echten Browser.

DOM Smoke darf pruefen:

- HTML-Datei existiert,
- Pflichtbereiche sind vorhanden,
- Manifest passt zur HTML-Datei,
- Summary und Risk Flags sind sichtbar,
- Inhalte sind escaped.

DOM Smoke zaehlt nicht als:

- Browser Automation,
- Screenshot Check,
- Human UI Review.

## Stufe 2: Browser Automation Smoke

Browser Automation Smoke oeffnet die lokale HTML-Datei in einem echten Browser oder Playwright-CLI-Lauf.

Browser Automation Smoke darf pruefen:

- Datei laedt als `file://` oder lokaler URL-Target,
- DOM ist im Browser erreichbar,
- zentrale Texte sind im Browser sichtbar.

Browser Automation Smoke zaehlt nicht automatisch als:

- Screenshot Check,
- Human UI Review.

## Stufe 3: Screenshot Check

Screenshot Check erzeugt ein Bildartefakt.

Screenshot Check darf nur behauptet werden, wenn ein Screenshot wirklich erzeugt und geprueft wurde.

Artefakte bleiben lokal, ausser ein eigener WLP-Contract erlaubt committed Evidence.

## Stufe 4: Human UI Review

Human UI Review ist eine menschliche Entscheidung.

Es darf nicht durch DOM Smoke, Browser Automation oder Screenshot allein ersetzt werden.

## BP-104 Freigabe

BP-104 darf einen DOM-Smoke als kleines Tool bauen:

- Input: HTML Preview und optional Manifest.
- Output: JSON Evidence.
- Keine Browser-Automation.
- Keine Screenshot-Behauptung.
- Kein BP-C5.

## BP-C4 Green Blocker

BP-C4 ist noch nicht vollstaendig gruen, solange:

- kein Browser Automation Smoke existiert,
- kein Screenshot Check existiert,
- kein Human UI Review fuer UI-Tasks dokumentiert ist.
