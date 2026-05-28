# Builder Adapter Persistence Decision v0

Datum: 2026-05-28
Status: BP-019 governance decision
Evidenzbasis: `docs/BUILDER_ADAPTER_AUTH_PERSISTENCE_BOUNDARY_v0.md`, `review-packets/BP-018.md`

Diese Datei entscheidet bewusst: Die aktuelle Builder-Adapter-Linie bleibt ohne Persistenz.

## Entscheidung

Keine Persistenz fuer den aktuellen Mock Builder Adapter.

Der aktuelle Stand bleibt:

- lokale Fixtures im Repo,
- Review Packets im Repo,
- Mock-IDs in Responses,
- keine Datenbank,
- keine Run-Dateien,
- keine Sessions,
- keine Audit-Archivierung ausser Review Packets,
- keine personenbezogenen Daten,
- keine Secrets.

## Warum

Persistenz wuerde jetzt Risiko erhoehen, ohne die naechste Produktfrage zu klaeren.

Die wichtige Frage ist zuerst:

```text
Ist die lokale Mock-Route als Boundary korrekt und reviewbar?
```

Diese Frage ist durch Fixtures, Review-Suite und Review Packets belegbar. Speicherung ist dafuer nicht noetig.

## Was spaeter definiert werden muss

Ein spaeterer Persistenz-Contract muss mindestens definieren:

- Speicherort.
- Datenschema.
- Run-ID-Format.
- Evidence-Referenzen.
- Retention.
- Loeschregel.
- Migration.
- Rollback.
- Umgang mit personenbezogenen Daten.
- Umgang mit Secrets.
- Zugriffspfad fuer Review.
- Exportformat fuer Review Packets.

Ohne diese Punkte bleibt Persistenz blockiert.

## Blockierte Speicherarten

Bis zu einem eigenen Contract sind blockiert:

- Datenbank.
- JSONL-Run-Log.
- Session-Datei.
- Cache-Datei.
- Browser Storage.
- Remote Storage.
- GitHub Issues oder PR-Kommentare als Run-Store.
- AICOS Mutation.
- Maya Write.

## Erlaubte Evidenz bis dahin

Erlaubt bleiben:

- committed fixtures,
- Review Packets,
- WLP Contracts,
- lokale Testausgabe,
- Raw URLs nach Push.

Diese Artefakte sind Review-Evidence, aber keine Runtime-Persistenz.

## Naechste sinnvolle Linie

Vor Persistenz sollte ein Live-Builder-Readiness-Audit klaeren:

- Welche Builder-Schnittstelle waere zuerst read-only sicher?
- Welche Auth-Posture waere fuer live noetig?
- Welche Timeouts und Error-Mappings braucht ein erster Adapter?
- Welche Evidence aus Builder kann ohne Write gelesen werden?
- Welche Scope-Gates sind live belegbar?

Erst danach lohnt ein Persistenz-Contract.
