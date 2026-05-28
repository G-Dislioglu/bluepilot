# BP-C2 Multi-model Pool Contract v0

Datum: 2026-05-28
Status: BP-091 runtime contract
Phase: BP-C2

## Entscheidung

Der Multi-model Pool startet als deterministische Routing-Schicht. Er ruft keine Provider auf.

## Provider

Der Pool kennt diese Provider als Routing-Ziele:

- `claude`
- `gpt`
- `gemini`
- `glm`
- `kimi`

## Rollen

Die erste Routing-Tabelle unterscheidet:

- `scout`: schnelle Suche, Vorpruefung, einfache Strukturierung.
- `worker`: Umsetzung, lokale Code- oder Dokumentarbeit.
- `judge`: Review, Gegenpruefung, Risiko- und Evidence-Bewertung.
- `maya`: Orchestration, User-nahe Entscheidung, Session-Zusammenfassung.

## Grenzen

Nicht enthalten:

- keine API-Calls,
- keine Secrets,
- keine Provider SDKs,
- keine Kostenlogik,
- keine automatische Modellwahl aus Live-Metriken,
- kein BP-C3 Parallel Executor.

## CLI

```bash
node tools/model-pool.cjs list
node tools/model-pool.cjs route scout
node tools/model-pool.cjs route worker --capability code
```

Die Ausgabe ist JSON und bleibt offline.
