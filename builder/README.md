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
BP-131 applied the empty Builder schema to the dedicated Neon project `bluepilot-builder`.

## Runtime Health

BP-132 adds a minimal HTTP runtime entry for Render and local probes:

- `GET /health` returns liveness and does not touch the database.
- `GET /health/db` runs a small database readiness probe and reports whether the Builder DB is
  reachable, missing configuration, or unreachable.

The server reads `PORT` from the environment and falls back to `3000` locally.

Render service settings for the later operator step:

```text
Root Directory: builder
Build Command: npm install && npm run typecheck && npm test
Start Command: npm start
```

Required Render environment variable:

```text
BLUEPILOT_BUILDER_DATABASE_URL=<Neon connection string for bluepilot-builder/neondb>
```

## Commands

```bash
npm start
npm test
npm run typecheck
```
