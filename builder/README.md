# Bluepilot Builder

This subpackage is the TypeScript home for the staged Builder migration from soulmatch.

It is intentionally separate from the Bluepilot root governance tools:

- root Bluepilot remains CommonJS and WLP-focused,
- Builder runtime code lives under `builder/`,
- TypeScript runs through `tsx`,
- imports use Node ESM conventions compatible with `.js` specifiers from TypeScript source.

BP-126 only creates the empty home and smoke test. It does not move any soulmatch Builder module.

## Commands

```bash
npm test
npm run typecheck
```
