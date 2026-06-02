# BP-143 - One-Shot Write Permit (DESIGN, kein Bau)

> Reiner Architektur-/Design-Contract. KEINE Implementierung in BP-143.
> Der Bau ist ein eigener Contract: BP-144 (siehe Sektion 10/11).
> Stand bluepilot/main: 019e7bf. Register-Ziel: maya-core (aicos-registry/master).
> ASCII-rein nach Repo-Konvention.

## 1. Das Problem in einem Bild

Heute haengen drei Dauer-Schalter an der Wand. Wenn alle drei auf "an" stehen,
darf geschrieben werden - und sie bleiben an, bis jemand sie von Hand wieder
umlegt. Das ist, als wuerde man die Haustuer aufschliessen und den Schluessel
stecken lassen, weil gleich ein Paket kommt. Solange der Schluessel steckt, kann
jeder durch. Der erste echte Write (Phase B) hat genau so funktioniert: Schalter
an, schreiben, Schalter wieder aus. Das ist fuer EINEN ueberwachten Test in
Ordnung. Als Dauerzustand ist es unsicher und umstaendlich.

Der Kern des Fehlers: die drei Schalter vermischen drei verschiedene Dinge.

## 2. Die Trennung der drei Dinge

- Faehigkeit: die Maschine KANN schreiben (Schreibadapter + GitHub-PAT). Das ist
  ein Werkzeug, kein Schalter. Es ist immer da. Ein Hammer ist auch immer da; das
  Problem ist nie der Hammer, sondern ob gerade jemand zuschlagen darf.
- Erlaubnis: DIESER eine Schreibvorgang ist freigegeben. Pro Akt, einmalig,
  befristet. Das ist der "Schein" - wie ein Garderoben-Zettel: gilt fuer genau
  diese Jacke, einmal, und ist danach entwertet.
- Politik: was darf von selbst durch, was braucht einen Menschen. Eine stehende
  Regel. Sie erlaubt von sich aus NICHTS. Sie entscheidet nur, WER den Schein
  ausstellen darf (Mensch oder Maya), und unter welchen Grenzen.

Heute taeuscht das System Sicherheit vor, weil "alle Schalter aus" sicher
aussieht. Aber sobald sie an sind, ist alles offen. Der Schein dreht das um:
Faehigkeit ist immer da, aber ohne gueltigen Schein passiert nichts.

## 3. Was ein Schein ist (Datenmodell)

Ein Permit-Eintrag im Register (maya-core). Wiederverwendbar ist nur das MUSTER:
builder_artifacts kennt schon approval_ticket und einen sha256-Helfer. Der
Permit-Mechanismus selbst - Register, Ablaufzeit, atomarer Verbrauch und die
Write-Bindung - ist ein echter Neubau, kein kleines Andocken. Felder:

- permitId            eindeutige Kennung
- issuer              WER hat ihn ausgestellt: "human:guercan" oder
                      "maya:policy" (mit Stufe). Macht spaeter im Audit
                      unmissverstaendlich klar, ob ein Mensch oder die Maschine ja
                      gesagt hat.
- targetRepo          z.B. G-Dislioglu/bluepilot-sandbox
- targetBranch        z.B. main
- targetPath          die genaue Datei
- op                  "create" oder "update" - HART festgelegt (siehe 6.B)
- expectedBaseSha     bei update: der Blob-/Datei-SHA, den GitHub gerade hat;
                      bei create: leer und "muss fehlen" (siehe 6.B)
- contentHash         sha256 ueber den GENAUEN finalen Inhalt + die Koordinaten
                      (repo, branch, path, op, expectedBaseSha). Bindet den Schein
                      an exakt diesen Schreibvorgang (siehe 5.1).
- contentBytesLen     Laenge als zweiter, billiger Abgleich
- issuedAt            Ausstellzeit (Serveruhr)
- expiresAt           Ablaufzeit (Serveruhr, kurz)
- usedAt              wird beim Verbrauch gesetzt; vorher leer
- status              "issued" | "consumed" | "expired" | "revoked"
- policySnapshot      bei maya:policy: die Regel-Begruendung, die den Schein
                      gerechtfertigt hat (fuer spaetere Nachkontrolle)
- auditRef            Verweis auf das Audit-/Evidence-Bundle

## 4. Lebenslauf eines Scheins (Zustandsautomat)

```
   issued
     |  (Korridor prueft: gueltig? nicht abgelaufen? nicht verbraucht?
     |   Not-Aus aus? Hash passt? Ziel erlaubt?)
     |  -- atomar: gleichzeitig pruefen UND auf consumed setzen --
     v
  consumed  --> genau EIN Schreibversuch
     |              |
     |              +-- GitHub akzeptiert --> done
     |              +-- GitHub lehnt ab    --> failed (Schein bleibt verbraucht)
     |
   (oder) expired / revoked, falls nie verbraucht
```

Harte Regel: ein Schein = EIN Versuch. Ein fehlgeschlagener Write (z.B. GitHub
502) verbraucht den Schein trotzdem; ein erneuter Versuch braucht einen NEUEN
Schein. Begruendung in 6.D - lieber etwas Reibung als ein zweites offenes Fenster.

## 5. Die zwei harten Anforderungen (von Codex) - nicht verhandelbar

Diese zwei sind keine Details, sondern die Stellen, an denen so ein System real
kippt. Beide sind Pflicht-Akzeptanzkriterien fuer den spaeteren Bau.

### 5.1 Bindung an den Inhalt, nicht nur an Repo + Datei
Ein Schein, der nur "Datei X in Repo Y" sagt, wuerde zwischen Freigabe und
Ausfuehrung JEDEN Inhalt in diese Datei durchwinken. Der Schein muss an einen
Inhalts-Hash des konkreten Schreibvorgangs gebunden sein. Freigegeben wird DIESER
exakte Inhalt an DIESER Stelle - nicht "diese Datei darf mal beschrieben werden".

### 5.2 Atomare Einmal-Nutzung (Compare-and-Set)
Wenn zwei Writes gleichzeitig denselben Schein pruefen, BEVOR einer ihn als
verbraucht markiert, gehen beide durch. Das Verbrauchen muss serverseitig in EINEM
Schritt geschehen: gleichzeitig "gueltig?" pruefen und "verbraucht" setzen, sodass
der zweite garantiert leer ausgeht. Klassischer Compare-and-Set (DB-seitig: ein
bedingtes UPDATE auf status='issued' -> 'consumed', das genau 0 oder 1 Zeile
trifft; nur bei 1 ist der Schein "gewonnen").

## 6. Vier weitere Stellen, an denen es sonst kippt (gleiche Risikoklasse)

Die zwei Punkte oben sind richtig - aber sie machen das Design noch nicht
vollstaendig. Die folgenden vier gehoeren in dieselbe "kippt-real"-Klasse und
muessen vor dem Bau entschieden sein.

### 6.A Wo der Hash NACHGERECHNET wird
Der gefaehrliche Restspalt: wenn der Schein bei der AUSSTELLUNG an Inhalt A
gebunden wird, der Builder aber erst spaeter schreibt, koennte zwischen
"Schein gewonnen" und "tatsaechlich gesendet" ein anderer Inhalt rausgehen.
Dann hat man das Zeitfenster nur verschoben, nicht geschlossen.
Anforderung: der Hash muss DIREKT NEBEN dem tatsaechlichen Sende-Aufruf
nachgerechnet werden - aus genau den Bytes, die an GitHub gehen. Stimmt er nicht
mit dem Schein ueberein, wird nicht gesendet. Der Abgleich sitzt also am
Werkzeug-Ausgang, nicht nur am Schalter beim Ausstellen.
(maya-core haelt das Register und stellt aus; der Builder haelt den PAT und
schreibt. Diese Trennung ist gut - aber genau deshalb muss der letzte Hash-Check
beim Builder, am Byte-Ausgang, sitzen.)

### 6.B Create vs. Update + Base-SHA-Pin (GitHub als zweite Schranke)
BP-142 hat ganze-Datei-Writes eingefuehrt (putFileContent: sha vorhanden = update,
fehlt = create). Damit ist "Diff" nicht immer die Einheit - bei einer neuen Datei
gibt es keinen Diff, sondern vollen Inhalt. Zwei Folgen:
1. Der Schein muss den Modus (create ODER update) hart festlegen. Sonst koennte
   derselbe Inhalt mal anlegen, mal ueberschreiben.
2. Bei update muss der Schein den erwarteten Base-SHA tragen, und der Write muss
   ihn an GitHub durchreichen. GitHubs PUT mit sha lehnt ab, wenn sich die Datei
   inzwischen geaendert hat. Damit wird GitHub selbst zur zweiten atomaren
   Schranke gegen "die Datei war beim Ausstellen anders als beim Schreiben".
   Bei create: GitHub legt nur an, wenn die Datei NICHT existiert.

### 6.C Geschuetzter-Pfad-Boden, unabhaengig von der Politik
Der BP-140-Fang (opusSmartPush war hart auf soulmatch verdrahtet und ignorierte
das Ziel) zeigt das reale Risiko: ein Default-Ziel-Leck. Deshalb ein stehender,
nicht abschaltbarer Boden, der am Verbrauch geprueft wird - UNABHAENGIG von der
Politik-Konfiguration:
- Ein maschinell ausgestellter Schein (issuer = maya:policy) darf NIE etwas
  anderes als bluepilot-sandbox treffen. Hart, im Korridor, nicht konfigurierbar.
- soulmatch und maya-core: nur Mensch-ausgestellte Scheine, niemals maschinell.
Selbst wenn die Politik-Konfiguration falsch ist, faengt dieser Boden es ab.
(Verteidigung in der Tiefe: targetRepo nicht als Default annehmen, sondern gegen
eine explizite Erlaubnisliste pruefen.)

### 6.D Wiederholversuch-Semantik
Ein verbrauchter Schein + ein transienter GitHub-Fehler (502) = legitimer Retry
schlaegt fehl. Zwei Wege:
1. Schein deckt "ein von GitHub bestaetigtes Schreiben" - dann oeffnet sich aber
   wieder ein CAS-Fenster zwischen Pruefen und Bestaetigen.
2. Schein = genau ein Versuch; Fehlschlag braucht einen neuen Schein.
Empfehlung: Weg 2 (sicherer, einfacher, etwas mehr Reibung). Bewusst so
festgelegt, nicht aus Versehen.

## 7. Stufen der Autonomie

- Stufe 0 - Mensch-Tor: jeder Write braucht Guercans explizites Ja. Nur ein
  Mensch stellt Scheine aus. Das ist der heutige Zustand, nur sauber gemacht.
- Stufe 1 - Maya als Treuhaenderin: im Politik-Rahmen darf Maya selbst einen
  Schein ausstellen (z.B. Sandbox + 1 Datei + Diff klein + Judge ok + kein
  geschuetzter Pfad). Immer noch einmalig, befristet, protokolliert. Ausserhalb
  des Rahmens: Eskalation an den Menschen.
  ACHTUNG (Goodhart-Risiko): die Politik ist selbst Code, der falsch sein oder
  ausgenutzt werden kann. Wenn die Regel "Diff klein + Judge ok" lautet, lernt ein
  optimierender Builder, kleine Diffs zu machen und dem Judge zu gefallen. Deshalb:
  Stufe 1 eng halten (nur Sandbox, nie soulmatch), jeden selbst-ausgestellten
  Schein prominent fuer die menschliche Nachkontrolle loggen, und den
  geschuetzter-Pfad-Boden (6.C) als unabhaengige Schranke behalten.
- Stufe 2 - abgestuft pro Ziel: Sandbox weit, soulmatch eng / nur Mensch. Der
  Boden aus 6.C macht "soulmatch = nur Mensch" zur harten Untergrenze, nicht zu
  einer einstellbaren Vorgabe.

## 8. Verhaeltnis zu den alten Flags

- MAYA_BUILDER_REPO_WRITE_ENABLED (maya-core): BLEIBT, aber nur noch als Not-Aus
  (Panik-Stopp). Es wird am Verbrauch fail-closed geprueft: steht es auf "aus",
  verbraucht KEIN Schein, egal wie gueltig. Der Not-Aus soll das dummste, am
  zuverlaessigsten Ding bleiben - ein einziger Boolean, denn im Notfall will man
  keinen klugen Mechanismus, sondern einen Hebel.
- BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED und MAYA_BUILDER_OPERATOR_APPROVED_WRITE
  (bluepilot-builder): entfallen als Arbeitsschalter. Ihre Aufgabe uebernimmt der
  Schein. (Bis der Bau steht, bleiben sie als heutiger Mechanismus bestehen und
  gehoeren nach jedem Test auf "false".)

## 9. Was BP-143 NICHT tut (Scope-Grenze, WLP)

- KEIN Code, KEIN Register-Bau, KEIN Korridor-Umbau.
- KEINE Aenderung am Laufzeitverhalten der drei Flags.
- KEINE neue Route, kein neues DB-Schema angewendet.
BP-143 liefert nur dieses Design: Datenmodell, Zustandsautomat, die beiden harten
Anforderungen als Akzeptanzkriterien, die vier zusaetzlichen Entscheidungen, die
drei Stufen und die Vertrauensgrenze (maya-core stellt aus + prueft, Builder
schreibt + rechnet den Hash am Ausgang nach).

## 10. Beide Seiten muessen sich aendern (Vorgriff auf BP-144)

BP-144 ist kein einseitiger Bau. Er fasst zwei Dienste an, die zusammenpassen
muessen:
- maya-core: das Permit-Register + der atomare Verbrauch (Compare-and-Set) +
  Ablauf/Revoke. Der heutige assessCorridor kennt die neuen Felder (permitId,
  Ziel-Repo, Pfad, op, expectedBaseSha, contentHash) noch NICHT - er muss sie
  pruefen, statt am Env-Flag zu haengen.
- bluepilot-builder: permitId, Ziel-Repo, Pfad, Operation, Base-SHA und
  Content-Hash muessen vom Auftrag bis in den Korridor UND bis in opusSmartPush
  durchgereicht werden. Der finale Hash-Check (6.A) sitzt am Byte-Ausgang von
  opusSmartPush/putFileContent.
Beide Seiten muessen denselben Hash-Inhalt und dieselbe Kanonisierung verwenden
(siehe Punkt 1 der offenen Entscheidungen), sonst lehnt der Korridor jeden
ehrlichen Write ab.

## 11. Offene Entscheidungen fuer den Bau-Contract (BP-144)

1. Kanonisierung des contentHash: was genau geht rein und in welcher Reihenfolge
   (repo, branch, path, op, expectedBaseSha, sha256(content)) - damit Aussteller
   und Ausgangs-Check garantiert dasselbe rechnen.
2. Ort + Mechanik des Registers: Tabelle in maya-core (an builder_artifacts
   anlehnen?) und die genaue CAS-Form (bedingtes UPDATE bzw. Unique-Constraint).
3. Form des Go-Signals zwischen Consume (maya-core) und Write (Builder):
   reicht eine Ja/Nein-Antwort, oder ein kurzlebiges, inhalts-gebundenes Token,
   das der Ausgangs-Check (6.A) gegenpruefen kann?
4. Konkrete TTL-Werte: Schein moeglichst SPAET ausstellen (erst wenn der Inhalt
   final ist, damit der Hash existiert), TTL nur so lang wie der Schreib-Aufruf
   selbst (Sekunden) - nicht der ganze Build.

## 12. Hinweis zur Anker-Hygiene (Neben-Thread)

Lokal sind STATE.md und SESSION-LOG.md bis BP-142 aktuell. Nachziehbeduerftig ist
docs/CLAUDE-CONTEXT.md: Phasenstand und Maya-Anbindungsplan spiegeln noch nicht
den Stand nach BP-142 / Phase B live. Zusaetzlich (Fund Codex): STATE.md sagt
inhaltlich bis BP-142, nennt aber noch "Aktueller Arbeitsbranch: bp-142...",
obwohl lokal main bei 019e7bf steht - beim naechsten Doc-Update mitziehen. Kein
Design-Blocker. Vor dem naechsten grossen Schritt sollte CLAUDE-CONTEXT nachgezogen
werden. Nicht Teil von BP-143.
(Mein Remote-Lesen zeigte SESSION-LOG nur bis BP-130 - das war ein veralteter
bzw. abgeschnittener Remote-Stand. Massgeblich ist der lokale Stand.)
