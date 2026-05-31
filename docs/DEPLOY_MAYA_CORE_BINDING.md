# Deploy - Maya-Core Binding

> Stand: 2026-05-31. Voraussetzungen, damit Bluepilot und andere Apps die eine kanonische
> Maya in maya-core wirklich live nutzen statt nur lokale oder gebuendelte Fallbacks.

## Worum es geht

Bluepilot soll Maya nicht als eigene Insel fuehren. Memory, Persona und spaeter Builder-Gates
sollen an maya-core andocken. Ohne Live-URL und Gate-Token bleibt Bluepilot absichtlich im
Fallback: funktional, aber nicht app-uebergreifend wachsend.

## Maya-Core

Maya-core ist der Dienst, der angerufen wird.

Er braucht:

- eine erreichbare Deploy-URL,
- `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`,
- deployte Endpunkte fuer die jeweils angebundene Stufe.

Fuer BP-123/BP-124 besonders wichtig:

- `POST /api/maya/memory`
- `GET /api/maya/memory`

BP-124 hat die Memory-Route so vorbereitet, dass sie denselben bestehenden Gate-Auth-Pfad nutzt
wie die Builder-Gates:

- `x-maya-core-gate-token: <token>`
- oder `Authorization: Bearer <token>`

Der Token wird gegen `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN` geprueft. Die normale
Maya-Session-Auth bleibt als Fallback intakt. Fehlender oder falscher Token bleibt ohne gueltige
Session geblockt.

## Bluepilot

Bluepilot braucht in der Deploy-Umgebung:

- `MAYA_CORE_URL` - Basis-URL des maya-core Deploys.
- `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN` - derselbe Token, den maya-core akzeptiert.

Wenn diese Variablen fehlen oder maya-core nicht erreichbar ist, nutzt Bluepilot den lokalen
Fallback aus `.bluepilot/maya-memory.json`. Fallback-Eintraege muessen als offline erkennbar bleiben
und duerfen nicht als gemeinsam gespeicherte Maya-Wahrheit erscheinen.

## Soulmatch

Soulmatch folgt demselben Grundmuster:

- `MAYA_CORE_URL`
- `MAYA_CORE_GATE_TOKEN` oder `MAYA_BUILDER_GATE_TOKEN`

Ohne Live-Binding nutzt Soulmatch gebuendelte Fallbacks fuer Maya-Identitaet und blockt
Gate-pflichtige Builder-Pfade fail-closed.

## Pruef-Checkliste

1. Maya-core Deploy ist erreichbar.
2. Ein Bluepilot-Memory-Vorschlag landet per `POST /api/maya/memory` in maya-core.
3. Der Eintrag hat `app_origin='bluepilot'` und `review_status='pending'`.
4. `GET /api/maya/memory` liefert nur bestaetigte Eintraege fuer prompt-sichtbare Nutzung.
5. Fehlender oder falscher Gate-Token ergibt `401`.
6. Lokaler Fallback wird nur genutzt, wenn URL oder Remote-Pfad fehlen oder nicht erreichbar sind.

## Noch offen

- BP-124 liegt in `aicos-registry` auf Branch `bp-124-maya-memory-auth` mit Commit `bf9407e`.
  Fuer echten Deploy muss dieser Stand nach maya-core `master` und in die laufende Umgebung.
- Persona/Stimme und Ethics/Builder-Gates sind separate spaetere Bluepilot-Aufgaben.
