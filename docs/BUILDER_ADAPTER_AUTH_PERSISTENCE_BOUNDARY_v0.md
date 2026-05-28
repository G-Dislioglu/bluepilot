# Builder Adapter Auth and Persistence Boundary v0

Datum: 2026-05-28
Status: BP-015 governance boundary
Evidenzbasis: `docs/BUILDER_ADAPTER_HTTP_MOCK_ROUTE_CONTRACT_v0.md`, `review-packets/BP-014.md`

Diese Datei definiert, was nach der lokalen HTTP-Mock-Route als naechstes erlaubt ist. Sie implementiert keine Auth, keine Persistenz und keine Live-Builder-Anbindung.

## Entscheidung

Auth, Persistenz und Live Builder Integration bleiben getrennte Arbeitslinien.

Der aktuelle Stand ist:

- Mock Builder Adapter CLI existiert.
- Mock Endpoint Handler existiert.
- Lokale HTTP-Mock-Route existiert.
- Review-Suite existiert.
- Keine echte Auth.
- Keine Persistenz.
- Keine Live Builder Calls.

Diese Trennung bleibt Pflicht, bis separate Contracts etwas anderes erlauben.

## Auth-Grenze

Erlaubter naechster Auth-Schritt:

- mock-only Header-Gate fuer lokale Tests,
- kein echtes Token,
- kein Cookie,
- kein Secret,
- kein Login,
- kein User-System,
- keine produktive Auth-Simulation.

Beispiel fuer spaeteren Mock-Header:

```text
X-Bluepilot-Mock-Auth: local-review
```

Regeln:

- Fehlender Mock-Header darf nur eine mock-safe blockierte Antwort erzeugen.
- Der Header darf nicht als echte Sicherheit behauptet werden.
- Der Header darf keine produktive Freigabe ersetzen.
- Der Header darf nicht in `.env`, Secrets oder externe Auth-Systeme fuehren.

## Persistenz-Grenze

Persistenz bleibt blockiert, bis ein eigener Contract mindestens definiert:

- Speicherort.
- Schema.
- Retention.
- Loeschregel.
- Evidence-Referenzen.
- Umgang mit personenbezogenen oder geheimen Daten.
- Migration-/Rollback-Regel.

Bis dahin gilt:

- keine Datenbank,
- keine Datei-Persistenz fuer Runs,
- keine Session-Speicherung,
- keine Audit-Archivierung ausser Review Packets im Repo,
- keine produktiven IDs ausser Mock-IDs.

## Live Builder Grenze

Live Builder Integration bleibt blockiert, bis ein eigener Contract mindestens definiert:

- konkrete Builder-URL oder lokale Mock-Ersetzung,
- Auth-Posture,
- Timeout,
- Retry-Regel,
- Error Mapping,
- Evidence Mapping,
- Scope-Gate-Beweis,
- Human Gate vor jeder Freigabe.

Nicht erlaubt:

- Builder live aufrufen,
- externe URL fetchen,
- API-Key oder Secret einfuehren,
- Auto-Merge,
- Auto-Deploy,
- echte Writes ohne Human Gate.

## Erlaubte naechste Schritte

Erlaubt als kleine Folgeaufgaben:

1. Mock-Auth-Header-Contract.
2. Mock-Auth-Header-Implementation auf lokaler HTTP-Mock-Route.
3. Persistenz-Decision-Note ohne Code.
4. Live-Builder-Readiness-Audit ohne Code.

Nicht erlaubt ohne neuen Contract:

- echte Auth,
- echte Persistenz,
- Live Builder Call,
- Netzwerkzugriff ausser lokalem `127.0.0.1` Testserver,
- Deployment,
- UI.

## Pflicht vor jedem Folgeblock

Vor jedem Folgeblock muss laufen:

```text
node tools/test-builder-adapter-review-suite.cjs
```

Wenn diese Suite rot ist, darf keine neue Adapter-Funktion gebaut werden.

## BP-016 Empfehlung

Der kleinste sinnvolle naechste Schritt ist ein Mock-Auth-Header-Contract.

Er soll nur definieren:

- Header-Name.
- erlaubter lokaler Wert.
- blockierte Antwort bei fehlendem/falschem Header.
- Testfaelle.
- ausdruecklich: keine echte Sicherheit.

Implementation erst danach.
