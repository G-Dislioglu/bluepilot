# Builder Render Deploy State

> Stand: 2026-05-31. Live-Anker fuer den ersten Bluepilot-Builder Render-Dienst.

## Service

| Feld | Wert |
|---|---|
| Render-Service | `bluepilot-builder` |
| Public URL | `https://bluepilot-builder.onrender.com` |
| Branch | `main` |
| Root Directory | `builder` |
| Build Command | `npm install --include=dev` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

## Live-Beweise

Geprueft am 2026-05-31.

| Route | Ergebnis |
|---|---|
| `GET /health` | HTTP 200, JSON `status: ok` |
| `GET /health/db` | HTTP 200, JSON `status: reachable`, `detail: database reachable` |

Damit ist belegt:

- Der Bluepilot-Builder-Prozess startet live auf Render.
- Die Liveness-Route ist erreichbar.
- Die DB-Readiness-Route erreicht die konfigurierte Builder-Datenbank.

## Environment

Gesetzte Runtime-Variable, nur als Name dokumentiert:

```text
BLUEPILOT_BUILDER_DATABASE_URL
```

Keine Werte, Connection Strings, Hosts, Rollen oder DB-Ressourcenkennungen werden in diesem Repo
dokumentiert.

## Grenzen

- Der Dienst bietet aktuell nur Health-/Readiness-Routen.
- Es gibt keine HTTP-Route, die einen Builder-Task startet oder Code schreibt.
- Der Free-Service kann nach Inaktivitaet einschlafen; der erste Aufruf danach kann deutlich
  langsamer sein.
- Das Provider-/Budget-Limit der externen DB-Infrastruktur kann bei dauerhafter echter Nutzung
  relevant werden.
- Maya-Gate bleibt ein separater naechster Block: `MAYA_CORE_URL` und ein Gate-Token muessen erst
  gesetzt werden, bevor der migrierte Maya-Gate-Client live entscheiden kann.

## Naechster Schritt

Nach diesem Anker kann die Maya-Gate-Infra geplant werden. Erst danach ist ein echter
End-to-End-Probelauf sinnvoll, weil das Sicherheits-Tor dann nicht nur fail-closed blockt,
sondern auch kontrolliert erlauben kann.
