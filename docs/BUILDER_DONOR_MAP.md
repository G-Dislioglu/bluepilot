# Builder Donor Map

Datum: 2026-05-25
Evidenzklasse: code-review-verified
Quelle: Builder Ist-Zustand Soulmatch Repo, direkte Code-Analyse laut Handoff
Status: donor map v0

Diese Datei sortiert nur Funktionen ein, die in der heutigen Ist-Zustand-Liste benannt wurden. Sie behauptet keine neue Bluepilot-Implementierung.

## A) Sofort als Builder-Donor nutzbar

Diese Bausteine sind laut Ist-Zustand-Liste code-review-verifiziert, API- oder lib-seitig vorhanden und ohne Soulmatch-Abhaengigkeit.

| Bluepilot-Bedarf | Builder-Donor | Uebernahmeform |
|---|---|---|
| Workrun / Task Lifecycle | Task CRUD, Run, Approve, Discard, Revert | `builder-adapter/tasks` |
| Human Gate | Approve / Discard / Revert, Prototype Approve | direkter Freigabe-Vertrag |
| Evidence Bundle | `/tasks/:id/evidence`, artifacts, audit | Kern fuer Bluepilot Evidence Bundle |
| Execution Engine | Opus Bridge Execute / Observe | Kern-Donor fuer Worker-Tracks |
| Git Push | Opus Bridge Push | nur hinter Bluepilot-Freigabe-Gate |
| Worker Track | Worker Direct, Swarm, Chain | zunaechst nur 1-2 sichere Tracks |
| Scope Safety | `builderScopeResolver.ts` | Pflicht vor jedem Write |
| File I/O | `builderFileIO.ts` | nur via Scope-Gates |
| Async Jobs | `asyncJobs`, observe, ops/query | Bluepilot Run-Persistenz |
| Model Pools | `poolState.ts` | Modellrouting, spaeter Benchmark-Anbindung |
| Audit | Task Audit + Bridge Audit | Bluepilot Audit Trajectory |
| Intake | Maya Intake System | Eingangskanal fuer externe Ideen |
| Kill Switch | Maya repo mutation kill-switch | Sicherheits-Gate uebernehmen |
| Team Briefing | Team briefing template/receipt | Worker-Start-Kontext |
| Canary | Builder Canary | optional fuer Phase-Promotion |
| Context Files | `/api/context/files/read` | generischer Kontextleser |
| Ops Query | `/api/context/ops/query` | Builder-State read-only |

## B) Adapterpflichtig, aber wertvoll

Diese Teile sind brauchbar, brauchen aber Entkopplung oder Bluepilot-spezifische Vertraege.

| Bereich | Problem | Bluepilot-Behandlung |
|---|---|---|
| Context Broker `session-start` | Soulmatch Anchor-Pfade | generischen Anchor-Vertrag bauen |
| Architecture Digest | Soulmatch Parser/Conventions | als `repo-digest-adapter` neu kapseln |
| Maya Context / Director / Chat | persona/studioPrompt/maya-core ungeschnitten | erst nach Maya-Core-Schnitt oder ueber Maya-Adapter |
| Visual Perception | Screenshots generisch, Council/Auto-Pick unklar | nur Screenshot/Capture zuerst |
| Desktop Bridge | Spec vorhanden, Agent nicht live | nicht MVP-writefaehig, spaeter Evidence-Kanal |
| Swarm | experimentell | nur nach Phase Scanner und Independence Check |
| Patrol Repair Loop | experimentell | read-only Findings zuerst, keine Auto-Reparatur |

## C) Nicht als Bluepilot-Donor uebernehmen

| Bereich | Grund |
|---|---|
| Render Integration | Soulmatch-Service-ID, projektgebunden |
| Builder Chat Fusion | arcana/persona-Schemas, Maya-Chat-Seite Soulmatch-gebunden |
| Freier Maya Chat aus Builder | zu stark an Soulmatch-Persona gekoppelt |
| Unbegrenzter Council / Auto-Council | Bluepilot braucht Trigger und Budget-Gates |

## Arbeitsurteil

Builder ist ein echter Execution-Donor fuer Bluepilot Phase 0/1. Bluepilot muss zuerst nicht selbst bauen koennen, sondern vorhandene Builder-Faehigkeiten sicher, auditierbar und produktneutral ansteuern.
