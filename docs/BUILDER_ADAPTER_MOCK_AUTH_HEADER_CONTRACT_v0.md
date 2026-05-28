# Builder Adapter Mock Auth Header Contract v0

Datum: 2026-05-28
Status: BP-017 governance contract
Evidenzbasis: `docs/BUILDER_ADAPTER_AUTH_PERSISTENCE_BOUNDARY_v0.md`, `review-packets/BP-016.md`

Diese Datei definiert nur ein lokales Mock-Auth-Gate. Sie implementiert keine Auth und fuehrt keine echten Tokens, Cookies, Secrets, Logins oder User ein.

## Entscheidung

Die lokale HTTP-Mock-Route darf spaeter einen Mock-Header verlangen:

```text
X-Bluepilot-Mock-Auth: local-review
```

Dieser Header ist kein Sicherheitsmechanismus. Er ist nur ein lokales Review-Gate, damit Tests und spaetere UI-Flows den Unterschied zwischen "Request ist formal lokal freigegeben" und "Request ist ohne Mock-Freigabe geblockt" sehen koennen.

## Header-Regel

Pflicht fuer BP-018:

- Header-Name: `X-Bluepilot-Mock-Auth`
- Erlaubter Wert: `local-review`
- Vergleich: exakt nach Trimming von Whitespace
- Fehlender Header: blockierte Mock-Response
- Falscher Header: blockierte Mock-Response
- Richtiger Header: Request laeuft weiter in die bestehende Mock-Route-Logik

## Blockierte Antwort

Fehlender oder falscher Header muss eine mock-safe Antwort liefern:

```json
{
  "adapter_run_id": "mock-builder-adapter-auth-blocked",
  "status": "blocked",
  "builder_task_id": null,
  "decision_ready": false,
  "changed_files": [],
  "evidence": {},
  "blocked_reasons": ["mock auth header missing or invalid"],
  "requires_human_gate": true,
  "mock": true
}
```

HTTP-Status fuer fehlenden/falschen Header:

```text
403
```

## Nicht-Ziele

Nicht erlaubt:

- echtes Token,
- Secret,
- Cookie,
- Session,
- Login,
- User-ID,
- Rollenmodell,
- Persistenz,
- produktive Auth-Behauptung,
- externe Auth-Provider,
- `.env` oder Konfigurationsdatei fuer Auth.

## Testanforderungen fuer BP-018

BP-018 muss mindestens testen:

1. Gueltiger Header + `BP-007.allow.input.json` -> bestehende completed Mock-Antwort.
2. Fehlender Header + valider Body -> HTTP 403, mock-safe blocked body.
3. Falscher Header + valider Body -> HTTP 403, mock-safe blocked body.
4. Gueltiger Header + `BP-007.reject.input.json` -> bestehende blocked Mock-Antwort.
5. Gueltiger Header + invalid JSON -> bestehende invalid-JSON Mock-Antwort.
6. Bestehende Review-Suite bleibt gruen oder wird bewusst um Mock-Auth erweitert.

## Implementierungsgrenze fuer BP-018

BP-018 darf nur:

- den lokalen HTTP-Mock-Server um dieses Header-Gate erweitern,
- Tests fuer gueltigen, fehlenden und falschen Header ergaenzen,
- bestehende Fixtures weiterverwenden,
- `mock=true` und `decision_ready=false` beibehalten.

BP-018 darf nicht:

- echte Auth einfuehren,
- Secrets verwenden,
- Persistenz bauen,
- Live Builder aufrufen,
- Deployment oder UI beruehren.

Wenn fuer BP-018 ein breiterer Umbau noetig wird, ist das ein `HARD STOP` und kein stilles Mitbauen.
