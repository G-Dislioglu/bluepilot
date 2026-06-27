# bluepilot — Projekt-Kontext (für Cowork & jede neue Sitzung)

> Diese Datei gibt sofortigen Kontext. Bitte zuerst lesen, bevor an bluepilot gearbeitet wird.

## Was ist das hier
Dies ist der **kanonische bluepilot-Projektordner**. Frisch von GitHub geklont am **27.06.2026**, bewusst **außerhalb von OneDrive** (OneDrive + Git = Sync-Konflikte & Langsamkeit).

- **Pfad:** `C:\Users\guerc\bluepilot`
- **GitHub (Wahrheits-Stand):** `https://github.com/G-Dislioglu/bluepilot.git` (remote `origin`)
- **Stand beim Anlegen:** Branch `main` @ `f4c5333` ("docs: add codex learning log rule", 24.06.2026), sauber & synchron mit `origin/main`.
- **Umfang:** 1372 Quelldateien, `package.json` vorhanden, 136 Branches auf GitHub.

## Grundsatz: GitHub ist die Wahrheit
Alles Committete liegt auf GitHub. Dieser Ordner ist eine saubere Spiegelung davon. Bei Unklarheit immer gegen GitHub abgleichen (`git fetch`, `git status`).

## Wichtiger offener Arbeitsstrang
- **Branch `wire-slice-002`** (Commit `1e97f85`, am 26.06. gesichert & gepusht): das erste echte Live-Feature — die **Dispatch-Dry-Run-Readback-Route** ("Motor anschalten"). Dateien u. a. `builder/src/dispatchDryRunReadbackRoute.ts`, `builder/src/server.ts` (Route hinter Env-Flag `BLUEPILOT_DISPATCH_DRY_RUN_READBACK_ROUTE_ENABLED`), `contracts/WIRE-SLICE-002.json`.
- Auschecken bei Bedarf: `git fetch origin` → `git checkout wire-slice-002`.

## Alte, verstreute Kopien (redundant — NICHT mehr hier arbeiten)
Diese enthalten nichts, was nicht auf GitHub liegt. Können später bewusst archiviert/entfernt werden (vorher je Kopie auf uncommittete Arbeit prüfen):
- `C:\Users\guerc\OneDrive\Desktop\bluepilot` (hatte die WIP — gesichert)
- `C:\Users\guerc\Documents\Codex\2026-05-29\hi-letzte-letzte-chat-hatte-dauernd\bluepilot`
- `C:\Users\guerc\Documents\Codex\2026-06-03\files-mentioned-by-the-user-eingef-2\work\bluepilot`
- `C:\Users\guerc\Documents\Codex\2026-06-11\der-letzte-chat-ist-sehr-lang\work\bluepilot`
- `C:\Users\guerc\Documents\Codex\2026-06-19\cl\work\repo-audit\bluepilot`
- `C:\Users\guerc\Documents\Codex\2026-06-21\hi\work\repo-audit\bluepilot`

## So nimmst du die Arbeit auf
1. `cd C:\Users\guerc\bluepilot`
2. `git fetch origin` und `git status` — wo stehe ich, gibt es Neues?
3. Arbeiten auf einem Branch; vor jedem Schreib-/Push-Schritt: erst zeigen, was passiert, dann bewusst freigeben (Mensch im Tor).

## Richtung (Notiz)
Thema "Motor vor Governance": weniger Governance-Overhead, mehr lauffähiger Motor. Große Architektur-Entscheidung — bewusst und getrennt angehen, nicht nebenbei.

---
_Diese Datei ist eine lokale Kontext-Notiz (untracked). Bei Bedarf committen oder per `.gitignore` lokal halten._
