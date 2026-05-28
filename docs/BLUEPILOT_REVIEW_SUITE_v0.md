# Bluepilot Review Suite v0

Datum: 2026-05-28
Status: BP-030 usage note

Diese Datei beschreibt den lokalen Review-Suite-Einstieg fuer Bluepilot.

## Bevorzugter Einstieg

```bash
node tools/test-bluepilot-review-suite.cjs
```

Dieser Befehl ist der gemeinsame Review-Einstieg fuer den aktuellen lokalen Stand.

## Legacy-Kompatibilitaet

```bash
node tools/test-builder-adapter-review-suite.cjs
```

Dieser Befehl bleibt gueltig, ist aber nur noch ein Wrapper auf die Bluepilot Review Suite.

Grund: Der alte Name stammt aus der Builder-Adapter-Linie. Die Suite prueft inzwischen mehr als nur Builder-Adapter-Code.

## Aktuelle Abdeckung

Die Suite prueft lokal:

- Builder Adapter Syntax.
- Builder Adapter Fixtures.
- Mock Builder Endpoint Fixtures.
- Mock Builder HTTP Route Fixtures.
- Builder Live Read Probe Fixtures.
- Builder Live Read Probe CLI Errors.
- Phase Scanner Syntax.
- Phase Scanner Fixtures.
- Phase Scanner CLI Errors.
- Phase Scanner Output Invariants.
- Phase Scanner Coverage Map.
- Scope Resolver Syntax.
- Scope Resolver Fixtures.
- Scope Resolver Output Invariants.

## Was die Suite nicht beweist

Die Suite beweist nicht:

- Live Builder Zugriff.
- echte Auth.
- Secrets.
- Datenbankverhalten.
- Deploy-Faehigkeit.
- Human Approval.
- echte Maya Review UI.
- echten Builder Scope Resolver.
- Builder Task Create.

## Arbeitsregel

Neue lokale Review-Checks sollen zuerst in `tools/test-bluepilot-review-suite.cjs` eingehaengt werden.

Der alte Builder-Adapter-Wrapper soll nur bleiben, solange externe Review-Gewohnheiten oder alte Handoffs ihn noch nennen.
