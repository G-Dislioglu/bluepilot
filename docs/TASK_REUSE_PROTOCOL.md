# Task Reuse Protocol v1.0a

AICOS Referenz: err-arch-ledger-without-reuse-path
Kernprinzip: Jeder gespeicherte Output braucht einen benannten Lese-Endpunkt.

## Das Problem

Protokolle, die geschrieben aber nie gelesen werden, sind Reflexions-Theater.

Test: Wurde dieses Review Packet nach dem Speichern nochmal gelesen und hat es eine Entscheidung beeinflusst?

## Pflicht-Reuse-Targets

### TARGET A - Next-Task PRE-LOCK Read

Der naechste Task liest aus dem vorherigen Review Packet:

- DRIFT_CHECK: Dateien, die haeufig aus dem Scope rutschen.
- AUDITOR_FINDINGS: Bekannte Risiken.
- ASSUMPTIONS_CHECK: Welche Assumptions waren falsch.
- REUSE_NOTE: Explizite Uebergabe.

Pflichtfeld im Contract: `prior_task_findings`

### TARGET B - SESSION-LOG.md

Format:

```text
## [TASK_ID] - [TASK_NAME] - [Datum]
- Ergebnis: COMPLETE / REWORK / STOP
- Score: [0-100]
- Mode: [lite/standard/critical]
- Drift: keine / minor / major
- Key Finding: [1 Satz]
- Reuse durch: [TASK_ID des Tasks der diesen Eintrag gelesen hat]
```

### TARGET C - AICOS Card Kandidat

Trigger:

- Gleiches Auditor-Finding tritt zum zweiten Mal auf.
- Gleiche falsche Assumption in zwei Tasks.
- STOP ausgeloest, Ursache ist generalisierbar.

In REUSE_NOTE eintragen: `AICOS_CANDIDATE: [Muster]`

## Archiv-Drift-Test

Nach 30 Tagen: Anteil Review Packets mit mindestens einer Wiederverwendung messen.

Schwellwert: unter 30 Prozent Reuse-Rate = Protokoll ueberarbeiten.

## Was kein gueltiges Reuse-Target ist

- "Zukuenftige Verwendung"
- "Zur Dokumentation"
- Leeres Feld -> Contract ungueltig
