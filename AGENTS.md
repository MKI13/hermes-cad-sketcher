# Anleitung für Hermes Agenten und Contributor

Diese Datei ist Pflichtlektüre für alle Hermes Agenten, andere KI-Agenten und menschliche Contributor, die neue Erweiterungen, Funktionen oder Werkzeuge für **Hermes CAD Sketcher** schreiben.

Ziel: Neue Erweiterungen dürfen nicht nur einzeln funktionieren. Sie müssen sauber in das gesamte Programm passen, lokal geprüft sein und nachvollziehbar dokumentiert werden.

## Grundregel

**Kein Commit und kein Pull Request, wenn das Gesamtprogramm nicht geprüft wurde.**

Diese Datei ist die verbindliche Arbeitsanweisung für Agenten. Wenn `README.md` kürzer oder allgemeiner formuliert ist, gilt für Agenten immer `AGENTS.md`.

Vor jedem Commit muss mindestens laufen:

```bash
npm run check
```

`npm run check` führt die Tests und den Production-Build aus. Wenn dieser Check fehlschlägt, darf nicht committed werden.

## Pflicht-Workflow für neue Erweiterungen

1. **Repository sauber vorbereiten**
   - Für Agenten ist die reproduzierbare Installation `npm ci`.
   - Verwende Node.js 20 oder neuer. Wenn eine `.nvmrc` vorhanden ist, nutze diese Version.
   - Danach erst entwickeln oder prüfen.

2. **Repository verstehen**
   - Lies zuerst `README.md` und diese Datei vollständig.
   - Prüfe die bestehende Architektur, bevor du neue Dateien oder neue Patterns einführst.
   - Bestehende Kernlogik liegt vor allem unter `src/core/`.
   - UI- und Viewport-Logik liegt vor allem unter `src/ui/` und `src/App.tsx`.
   - Tests liegen unter `tests/`.

3. **Aufgabe klar abgrenzen**
   - Arbeite pro Commit nur an einer klaren Erweiterung, einem klaren Werkzeug oder einer klaren Dokumentationskorrektur.
   - Keine zufälligen Nebenänderungen.
   - Keine großen Umbauten, wenn eine kleine, getestete Erweiterung reicht.

4. **Tests mitdenken, nicht nachträglich raten**
   - Neue Kernfunktionen brauchen Tests.
   - Neue Import-/Export-Funktionen brauchen Testdaten oder strukturierte Beispieltests.
   - Neue Werkzeug-Zustände sollen möglichst als reine Funktionen testbar sein.
   - UI-Änderungen sollen die zugrunde liegende Logik nicht untestbar machen.

5. **Integration prüfen**
   - Die Erweiterung muss mit dem vorhandenen Modell, den Einheiten und den vorhandenen Werkzeugen zusammenarbeiten.
   - Millimeter bleiben die Basiseinheit.
   - IDs, Komponenten, Transformationen und Projektdateien dürfen nicht kaputtgehen.
   - Keine falsche Kompatibilität versprechen, besonders nicht bei DWG, SKP, RB oder RBZ.

6. **Gesamtprüfung ausführen**
   - Vor dem Commit immer ausführen:

   ```bash
   npm run check
   ```

   - Wenn der Check fehlschlägt:
     1. nicht committen,
     2. Fehler lesen,
     3. Ursache verstehen,
     4. Code oder Tests korrigieren,
     5. `npm run check` erneut ausführen,
     6. erst bei grünem Ergebnis committen.

7. **Dokumentation aktualisieren**
   - Wenn eine geplante Erweiterung vollständig umgesetzt und geprüft wurde, lösche sie selbst aus `Geplante Erweiterungen`.
   - Füge sie im gleichen Commit unter `Erledigte Funktionen und Werkzeuge` mit kurzer Beschreibung hinzu.
   - Wenn sich Bedienung, Datei-Formate oder Grenzen ändern, aktualisiere auch `README.md`.

8. **Commit sauber beschreiben**
   - Commit-Nachricht muss konkret sagen, was die Erweiterung genau macht.
   - Wenn eine geplante Erweiterung erledigt wurde, muss Commit oder PR-Text sagen, welche Aufgabe aus `Geplante Erweiterungen` entfernt und welcher Done-Eintrag ergänzt wurde.
   - Gute Beispiele:
     - `feat: add snap-aware rectangle drawing`
     - `feat: add project save and load workflow`
     - `fix: keep millimeter units stable during dxf import`
     - `test: cover viewport picking entity mapping`
   - Schlechte Beispiele:
     - `update`
     - `changes`
     - `work`

## Repository-Sicherheit, Branches und Versionen

Dieses Repository soll stabil bleiben. Nicht jeder Agent oder externe User darf frei Dateien ändern oder ungeprüften Code in das Projekt bringen.

### Schreibrechte

- Änderungen am offiziellen Repository dürfen nur durch Marios oder ausdrücklich autorisierte Maintainer/Hermes-Agenten erfolgen.
- Externe Personen oder fremde Agenten sollen Vorschläge als Pull Request, Patch oder Issue liefern, aber nicht ungeprüft direkt in das Hauptprojekt schreiben.
- Ohne ausdrückliche Autorisierung darf ein Gast-Agent keinen Branch im offiziellen Remote erstellen, nicht pushen und keine PRs im Namen des Projekts öffnen.
- `main` bleibt der stabile Stand.
- Direkte Pushes auf `main` sind nicht erlaubt.
- Neue Änderungen werden erst nach Prüfung und bestandenem `npm run check` übernommen.

### Branch-Strategie

Nicht für jede kleine Idee wahllos neue Branches anlegen. Zu viele parallele Branches machen das Projekt chaotisch.

Bevorzugte Struktur:

- `main` — stabiler geprüfter Stand.
- `dev/vX.Y` — gebündelte Entwicklungsarbeit für die nächste Version, zum Beispiel `dev/v0.2`.
- `release/vX.Y` — Release-Vorbereitung, nur wenn wirklich ein Release vorbereitet wird.
- `feat/...`, `fix/...`, `docs/...` — nur für klar abgegrenzte, kurzlebige Arbeiten.

Regeln:

- Kleine geprüfte Dokumentations- oder Reparaturänderungen sollen möglichst auf einem bestehenden passenden Arbeitsbranch landen, statt immer neue Branches zu erzeugen.
- Wenn ein aktiver Versionsbranch wie `dev/v0.2` existiert, landen normale neue Erweiterungen zuerst dort.
- Kurzlebige `feat/...`-Branches sind nur sinnvoll, wenn mehrere Arbeiten parallel laufen oder ein externer PR vorbereitet wird.
- Feature-Branches müssen nach Merge geschlossen oder gelöscht werden.
- Ein Commit darf erst gepusht werden, wenn die lokale Prüfung bestanden hat.
- Wenn mehrere Agenten arbeiten, müssen sie vorher den aktuellen Stand holen und dürfen keine fremden Änderungen überschreiben.

## Qualitätsmaßstab

Eine Erweiterung gilt erst als fertig, wenn alle Punkte erfüllt sind:

- Die Funktion ist in der Oberfläche oder im Kernmodell nutzbar, je nach Aufgabe.
- Die Funktion arbeitet mit bestehenden Funktionen zusammen.
- Es gibt passende Tests oder eine klare Begründung, warum ein Teil nicht automatisch testbar ist.
- `npm run check` ist erfolgreich durchgelaufen.
- Dokumentation und Aufgabenlisten sind aktualisiert.
- Der Commit beschreibt die Änderung konkret.
- Der Commit enthält nicht mehrere unabhängige Features auf einmal.

## Geplante Erweiterungen

Diese Liste ist eine Arbeitsliste für zukünftige Agenten und Contributor. Wenn eine Erweiterung fertig ist, verschiebe sie in die erledigte Liste.

1. **Push/Pull für Flächen erweitern**
   - Aktuell gibt es ein präzises Push/Pull-Panel für die Höhe ausgewählter Boxkörper.
   - Nächster Schritt: Rechtecke und beliebige Flächen kontrolliert zu Körpern extrudieren.
   - Später: Box-Flächen in Breite/Tiefe/Höhe gezielt ziehen.
   - Negative oder Null-Endmaße sauber blockieren.
   - Maße müssen in Millimeter stabil bleiben.

2. **Agent-erstellte Körper automatisch als Komponenten führen**
   - Wenn Hermes/Agent/Console einen Körper erstellt, soll der Körper standardmäßig eine eigene Komponente bekommen.
   - Wenn eine Baugruppe aus zwei oder mehr Körpern entsteht, müssen die Einzelkörper weiterhin trennbar, einzeln auswählbar und verschiebbar bleiben.
   - Komponenten brauchen später saubere Stücklisten-/OpenCutList-Metadaten, z. B. Teilname, Material, Stärke, Länge/Breite/Tiefe und Zuschnitt-Orientierung.
   - Keine reine Verschmelzung zu einem untrennbaren Mesh, wenn die Teile später getrennt bearbeitet oder zugeschnitten werden sollen.

3. **Körper-Faces für Zieh-/Push-Pull-Werkzeuge ausbauen**
   - Jeder Körper muss für die Bedienung klare Seiten/Faces bereitstellen: oben, unten, vorne, hinten, links, rechts.
   - Faces sollen auswählbar und für Ziehen/Push/Pull nutzbar sein, damit Maße in Millimeter direkt verändert werden können.
   - Boxkörper rendern bereits Seitenflächen; der nächste Schritt ist eine stabile Modell-/Command-Schicht für gezieltes Face-Ziehen in Breite, Tiefe und Höhe.
   - Null- oder Negativmaße müssen weiterhin blockiert werden.

4. **Komponenten als Instanzen verbessern**
   - Verschachtelte Komponenten vorbereiten.
   - Komponenten als Instanzen mit eigener Transformation modellieren.

5. **DXF-Import erweitern**
   - Weitere Entitäten erst nach fail-closed Tests ergänzen.
   - Testdateien unter `tests/fixtures/` ergänzen.


6. **Bundle-Größe reduzieren**
   - Three.js-Viewport dynamisch laden oder Vite-Code-Splitting nutzen.
   - Build-Warnungen dokumentieren oder reduzieren.

7. **DWG-Bridge planen**
   - Realistischen Workflow über LibreDWG, ODA File Converter oder andere Bridge dokumentieren.
   - Keine native DWG-Unterstützung behaupten, solange sie nicht wirklich existiert.

8. **SKP-Bridge planen**
   - Offizielle SketchUp C API und Lizenzlage prüfen.
   - Linux-Build realistisch bewerten.
   - Adapter-Interface ohne SketchUp-Abhängigkeit testbar halten.

9. **Weitere Werkzeuglogik aus React lösen**
   - Select, Move, Rotate und weitere Werkzeugaktionen als reine Funktionen testbar machen.
   - React soll möglichst nur Darstellung und Event-Anbindung übernehmen.

10. **Dateiformate erweitern**
    - `.obj`, `.glb`, `.ifc` oder `.step` nur nach realistischer technischer Prüfung ergänzen.
    - Import/Export nie als fertig markieren, wenn nur ein Teilformat unterstützt wird.

11. **Eigenes Erweiterungsformat planen**
    - Format wie `.hcad-ext` oder `.hcad-extension.json` prüfen.
    - Manifest, Berechtigungen, Versionen und Kompatibilitätsprüfung definieren.
    - Testbarer Loader ohne SketchUp-Ruby-Abhängigkeit.

## Erledigte Funktionen und Werkzeuge

Diese Liste soll nach jedem erfolgreichen Feature-Commit gepflegt werden.

- **Kernmodell in TypeScript** — Grundstruktur für CAD-Elemente und Operationen.
- **Millimeter als Basiseinheit** — Maße werden im Modell einheitlich in Millimeter geführt.
- **Linien, Rechtecke und Boxkörper** — Grundelemente für das Zeichnen.
- **Verschieben und Drehen um Z-Achse** — Basis-Transformationen im Modell.
- **Push/Pull-Grundfunktion für Körperhöhe** — einfache Höhenänderung für Boxkörper.
- **Komponenten/Gruppen** — Elemente können gruppiert werden.
- **Komponenten duplizieren** — bestehende Komponenten können mit neuen Element-IDs und Millimeter-Versatz kopiert werden.
- **Maßband-Grundfunktion** — Distanzen können berechnet und angezeigt werden.
- **DXF-Export-Grundlage und begrenzter DXF-Dateiimport** — erster Austausch mit DXF-Linien und geschlossenen, achsenparallelen Vierpunkt-Rechteck-Polylinien ohne Bulge/Breite/Dicke/Sonder-Extrusionsvektor; UI-Import zeigt importierte und übersprungene Entitäten im Status.
- **DXF-Layer-Metadaten für MVP-Entitäten** — importierte `LINE`- und unterstützte `LWPOLYLINE`-Rechtecke behalten DXF-Layernamen im Modell, zeigen sie im Inspector und exportieren sie wieder als DXF-Layerfeld.
- **Fail-closed DXF-Einheitenprüfung** — `$INSUNITS=4` wird als Millimeter akzeptiert, fehlende Einheiten werden sichtbar als Millimeter-Annahme gemeldet und bekannte andere Einheiten werden vor Geometrieimport abgelehnt.
- **ASCII-STL-Export für Boxkörper** — einfache STL-Ausgabe für Boxgeometrie.
- **ASCII-STL-Referenzmesh-Import** — synthetische ASCII-STL-Dateien können als nicht editierbare Referenzmeshes mit Dreieckszahl geladen, inspiziert, gerendert und in `.hcad.json` Projekten erhalten werden; Binary-STL und Solid-Healing bleiben bewusst ausgeschlossen.
- **Projektdatei speichern/laden** — `.hcad.json` Snapshot mit Version, Einheit, Elementen und Komponenten.
- **React/Vite-Oberfläche mit Werkzeugleiste** — Bedienoberfläche für die vorhandenen Werkzeuge.
- **Anpassbare Schnell-Werkzeugleiste** — kleine Werkzeug-Icons liegen oben, lassen sich per Drag-and-drop umsortieren und bieten Tastenkürzel für schnelle Arbeit.
- **SketchUp-inspirierter klassischer CAD-Arbeitsplatz** — eigene, rechtlich saubere Menü- und Werkzeuggruppen für Basis, Zeichnen, Modellieren, Messen, Kamera, Struktur und Visualisierung; der klassische Arbeitsplatz steht ganz oben. Jeder Menübutton öffnet den passenden Funktionsbereich, z. B. Datei → Datei & Import/Export und Bearbeiten → Bearbeiten & Maße. Die detaillierten Bearbeiten-/Maße-Funktionen erscheinen zuerst als Button-Verknüpfungen und öffnen danach als externe Fenster statt als große Dauerleiste.
- **Externe Funktionsfenster** — Bearbeiten-, Maße-, Inspektor-, Ruby- und Hermes-Agent-Fenster müssen verschiebbar, minimierbar und skalierbar/vergrößerbar/verkleinerbar bleiben, damit die CAD-Arbeitsfläche nicht blockiert wird.
- **Seitliche Icon-Werkzeugleiste** — die Seitenleiste ist bewusst nur eine schmale Icon-Leiste für die aktive Werkzeugwahl; Text und Formulare gehören in den oberen CAD-Arbeitsplatz oder in schwebende Fenster.
- **Linke-Maus-Standardaktion** — Linksklick ist die Hauptbedienung für Auswahl, Punktsetzen beim Zeichnen und Körperflächen-Auswahl.
- **Snapping und Körperlinien** — Linien und Körper stellen Anfangs-, End- und Mittelpunkt-Fangpunkte bereit; Boxkörper werden im Viewport als auswählbare Flächen plus sichtbares Linien-/Kantenskelett gerendert und bleiben im Modell als spätere Vollkörper-/3D-Druck-fähige Boxdaten erhalten.
- **Viewport-Zoom und SketchUp-ähnliche Orientierung** — Mausrad zoomt im Arbeitsbereich auf den Punkt unter der Maus; Nullpunkt-Hilfslinien zeigen rote, grüne und blaue Achsen.
- **Pfeil-Cursor ohne Dauersymbol** — der Viewport zeigt keinen dauerhaft störenden Werkzeug-Badge neben dem Mauszeiger; spezielle temporäre Cursorhinweise nur gezielt pro Funktion ergänzen.
- **Einheitenfeld unten rechts** — aktuelle Linienlängen, Rechteckmaße, Körpermaße, Maßbandwerte und Flächen in m² werden im Viewport sichtbar gehalten.
- **AI-Chat-Fenster** — der Agent-Chat kann als separates Fenster neben dem Viewport genutzt werden, bleibt aber standardmäßig geschlossen, damit er die Arbeitsfläche nicht blockiert.
- **Lokale Hermes-Agent-Bridge** — `scripts/hermes-cad-agent-bridge.py` bindet nur an `127.0.0.1:8766`; die Browser-App spricht über die gleiche CAD-App-Adresse mit `/hermes-cad/agent` und `/hermes-cad/identity`. Der Vite-Dev-Server leitet diese Pfade auf dem CAD-App-Host an die lokale Bridge weiter, damit Marios denselben CAD-Host auch von einem zweiten PC nutzen kann, ohne API-Keys im Browser und ohne die Bridge direkt im LAN zu öffnen. Jeder Agent-Auftrag erhält Zeichnungsmodus, Modell-Snapshot, Auswahl und die Policy `local-pc-agent-only`. Normale Chat-Nachrichten werden wie im Telegram-Chat beantwortet; CAD-Aktionen laufen zusätzlich über erlaubte Befehle.
- **Interaktiver Three.js-Viewport mit Picking und Auswahlmarkierung** — Szene aus dem Kernmodell rendern, Objekte anklicken und ausgewählte Elemente sichtbar hervorheben.
- **Axis-aligned Rechteck-Extrusion** — ausgewählte rechteckige, achsenparallele Flächen können mit positiver Millimeterhöhe zu Boxkörpern extrudiert werden.
- **GitHub Actions CI** — Pull Requests und wichtige Branches führen `npm ci` und `npm run check` automatisch aus.
- **Undo/Redo-Verlauf** — Modelländerungen werden als Snapshots historisiert; Rückgängig/Wiederholen ist über eigene UI-Schaltflächen möglich.
- **Selected-Entity-Inspector** — ausgewählte Linien, Flächen und Körper zeigen Maße, Bounding Box und relevante Werte in Millimeter.
- **Maus-Zeichnen mit Live-Vorschau** — Linien und Rechtecke über zwei Rasterklicks zeichnen; Boxkörper über einen Rasterklick mit einstellbaren Standardmaßen erzeugen.
- **Move- und Tape-Workflow im Viewport** — ausgewählte Elemente per Start-/Zielpunkt in Millimeter verschieben und Distanzen über zwei Klicks messen.
- **Auswahl löschen** — ausgewählte Elemente per Button oder Delete/Backspace entfernen; Komponentenreferenzen werden bereinigt. Delete/Backspace darf nicht feuern, wenn der Nutzer in `input`, `textarea`, `select` oder contenteditable Text bearbeitet; die UI weist sichtbar auf diese destruktiven Shortcuts hin.
- **Box-Dimensionspanel** — Standardmaße für neue Boxkörper in Millimeter setzen und ungültige Maße blockieren.
- **Präzises Verschieben** — ausgewählte Elemente per ΔX/ΔY/ΔZ in Millimeter transformieren.
- **Präzises Drehen** — ausgewählte Elemente per Grad-Eingabe um die Z-Achse drehen; Boxen bleiben dabei um ihren sichtbaren Mittelpunkt stabil.
- **Präzises Push/Pull für Boxhöhe** — ausgewählte Boxkörper per ΔH in Millimeter höher oder niedriger machen; ungültige oder auf Null führende Werte werden blockiert.
- **Ruby-Konsole / Hermes-CAD-Befehls-DSL** — sichere interne Bedienkonsole für `line`, `rectangle`, `box`, `move`, `rotate_z`, `resize`, `push_pull`, `extrude`, `delete`, `component`, `duplicate_component`, `select` und `list`; keine Systembefehle, keine SketchUp-Ruby-API und keine `.rb/.rbz` Plugin-Kompatibilität.
- **Agent-Chat-Brücke** — Hermes oder ein anderer AI Agent kann direkte CAD-Befehle oder einfache Sätze wie „erstelle box …“ und „verschiebe auswahl …“ live gegen dieselbe geprüfte Befehlslogik ausführen.
- **Auswahlbasierte Agent-Skripte** — Mehrzeilige Agent-Antworten wie `select box_1` gefolgt von einem nackten `delete` werden korrekt auf die aktuelle Auswahl angewendet. Mutierende Befehle ohne explizite Element-ID nutzen die aktuelle Auswahl, wenn eine vorhanden ist; ohne Auswahl bleibt der Befehl fail-closed. Dafür gibt es einen Regressionstest in `tests/cadCommandConsole.test.ts`.

## Sicherheits- und Realismusregeln

- Keine Unterstützung für SketchUp-Ruby-Plugins (`.rb`, `.rbz`) versprechen.
- Keine native DWG- oder SKP-Kompatibilität behaupten, solange nur eine geplante Bridge existiert.
- Die Benutzeroberfläche darf SketchUp-ähnlich und vertraut wirken, aber keine geschützten SketchUp-/Trimble-Layouts, Logos, Icons, Werkzeug-Symbole oder markenrechtlich geschützten Designs kopieren.
- Werkzeugnamen und Symbole sollen eigenständig gestaltet werden, auch wenn die Bedienlogik für CAD-Nutzer vertraut ist.
- Keine großen Binärdateien, generierten Ordner oder unnötigen Build-Artefakte committen.
- Keine Zugangsdaten, Tokens oder privaten Dateien committen.
- Keine Funktion als fertig dokumentieren, wenn sie nur teilweise funktioniert.
- Agent-/Console-Befehle bleiben eine sichere Hermes-CAD-DSL, keine echte Ruby- oder JavaScript-Ausführung. Befehle dürfen nur über die erlaubte Modell-API laufen und müssen in Millimeter arbeiten.
- Wenn ein Agent mutierende Befehle in mehreren Zeilen liefert, muss die aktuelle Auswahl zwischen den Zeilen erhalten bleiben, z. B. `select box_1` danach `delete`. Gleichzeitig dürfen Befehle ohne Auswahl nicht raten, sondern müssen fail-closed antworten.
- Für Möbelbau/OpenCutList-nahe Arbeit keine untrennbaren Meshes erzeugen, wenn einzelne Bauteile später getrennt verschoben, gemessen, zugeschnitten oder gelistet werden müssen.

## Benutzeroberfläche und SketchUp-Ähnlichkeit

Hermes CAD Sketcher soll sich für Anwender vertraut anfühlen, die moderne SketchUp-Versionen kennen: schnelle Werkzeugleiste, Orbit/Pan/Zoom, Push/Pull-artiges Arbeiten, Maßband, Gruppen/Komponenten und direkte Arbeit mit Maßen.

Wichtig:

- Das Programm darf nicht als SketchUp-Kopie auftreten.
- Keine SketchUp-/Trimble-Marken, Logos, Icons oder exakt kopierten UI-Elemente verwenden.
- Eigene Icons, eigene Farben und eigene Benennungen verwenden, wenn rechtliche Unsicherheit besteht.
- Vor größeren UI-Änderungen prüfen, ob sie nur vom Bedienkonzept inspiriert sind oder zu nah an geschützten Originalen liegen.
- Ziel ist eine eigene, rechtlich saubere Linux-CAD-Oberfläche für EF-Sinn und Marios.

## Hermes-Agenten-Bedienung und eigenes Erweiterungsformat

Langfristig soll Hermes CAD Sketcher eine direkte Bedien- und Automationsschnittstelle für Hermes Agenten bekommen. Das soll ähnlich nützlich sein wie eine Ruby Console in SketchUp, aber nicht SketchUp-Ruby, `.rb` oder `.rbz` nachbauen.

Zielbild:

- Eine interne Agenten-/Skript-Konsole im Programm.
- Klare Befehle für Modellaktionen, zum Beispiel Zeichnen, Messen, Auswählen, Gruppieren, Exportieren und Prüfen.
- Ein eigenes kompatibles Erweiterungsformat für dieses Programm, zum Beispiel `.hcad-ext` oder `.hcad-extension.json`.
- Erweiterungen müssen deklarieren, welche Werkzeuge, Befehle, UI-Elemente und Berechtigungen sie brauchen.
- Jede Erweiterung muss ohne SketchUp-Abhängigkeit laufen.
- Jede Erweiterung braucht Tests und muss mit `npm run check` geprüft werden.
- Unsichere Erweiterungen dürfen nicht automatisch geladen werden.

Regel: Statt `.rb`/`.rbz` wird ein eigenes Hermes-CAD-Erweiterungssystem geplant, das 100% zu diesem Programm passt und nicht fremde Plugin-APIs vortäuscht.

## Pull-Request-Checkliste

Jeder Pull Request oder Commit-Handoff soll enthalten:

- Was wurde geändert?
- Welche Erweiterung/Funktion/Werkzeug wurde umgesetzt?
- Welche Dateien und Formate sind betroffen?
- Welche Tests wurden ergänzt oder angepasst?
- Ergebnis von `npm run check`.
- Welche Aufgabe wurde aus `Geplante Erweiterungen` gestrichen?
- Welcher Eintrag wurde zu `Erledigte Funktionen und Werkzeuge` ergänzt?
- Bekannte Grenzen oder Risiken.

## Kurzfassung für Agenten

Wenn du unsicher bist: klein anfangen, bestehende Architektur respektieren, Tests schreiben, `npm run check` ausführen, Dokumentation aktualisieren und erst dann committen.

**Maße zuerst. Stabilität zuerst. Keine ungeprüften Commits.**
