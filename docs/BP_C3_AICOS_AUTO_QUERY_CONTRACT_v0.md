# BP-C3 AICOS Auto-query Contract v0

Datum: 2026-05-28
Status: BP-097 runtime contract
Phase: BP-C3

## Entscheidung

AICOS Auto-query startet als read-only Keyword-Match.

Es schreibt keine AICOS-Dateien und mutiert keine Registry.

## Quellen

Unterstuetzt:

- lokaler Index via `--index <path>`,
- optionaler read-only Fetch von `https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/master/index/INDEX.json`.

Tests nutzen lokale Fixtures.

## Output

```json
{
  "query": "parallel executor worktree conflict",
  "matches": [
    {
      "card_id": "sol-dev-006",
      "score": 3,
      "reasons": ["title:worktree", "tags:conflict"]
    }
  ]
}
```

## Grenzen

- keine Embeddings,
- keine Vektor-Datenbank,
- kein AICOS-Write,
- keine automatische Contract-Mutation,
- keine UI.
