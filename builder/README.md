# Bluepilot Builder

This subpackage is the TypeScript home for the staged Builder migration from soulmatch.

It is intentionally separate from the Bluepilot root governance tools:

- root Bluepilot remains CommonJS and WLP-focused,
- Builder runtime code lives under `builder/`,
- TypeScript runs through `tsx`,
- imports use Node ESM conventions compatible with `.js` specifiers from TypeScript source.

BP-126 created the empty home and smoke test.
BP-127 moved the first pure-logic module wave.
BP-128 adds the Builder database foundation: the full empty Builder schema, a builder-local
Neon/Drizzle access layer, and the first two DB-only modules.

Runtime database access uses a dedicated environment variable:

```bash
BLUEPILOT_BUILDER_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Local tests do not require a live database. A missing database URL must fail clearly at `getDb()`.
Creating the actual database and pushing the schema is an operator infrastructure step for later
deployment, not part of BP-128 verification.

## Commands

```bash
npm test
npm run typecheck
```
