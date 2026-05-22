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

2. **Komponenten als Instanzen verbessern**
   - Verschachtelte Komponenten vorbereiten.
   - Komponenten als Instanzen mit eigener Transformation modellieren.

3. **DXF-Import erweitern**
   - Layer auslesen.
   - Weitere Entitäten erst nach fail-closed Tests ergänzen.
   - Testdateien unter `tests/fixtures/` ergänzen.


4. **Bundle-Größe reduzieren**
   - Three.js-Viewport dynamisch laden oder Vite-Code-Splitting nutzen.
   - Build-Warnungen dokumentieren oder reduzieren.

5. **DWG-Bridge planen**
   - Realistischen Workflow über LibreDWG, ODA File Converter oder andere Bridge dokumentieren.
   - Keine native DWG-Unterstützung behaupten, solange sie nicht wirklich existiert.

6. **SKP-Bridge planen**
   - Offizielle SketchUp C API und Lizenzlage prüfen.
   - Linux-Build realistisch bewerten.
   - Adapter-Interface ohne SketchUp-Abhängigkeit testbar halten.

7. **Weitere Werkzeuglogik aus React lösen**
   - Select, Move, Rotate und weitere Werkzeugaktionen als reine Funktionen testbar machen.
   - React soll möglichst nur Darstellung und Event-Anbindung übernehmen.

8. **Dateiformate erweitern**
    - `.obj`, `.glb`, `.ifc` oder `.step` nur nach realistischer technischer Prüfung ergänzen.
    - Import/Export nie als fertig markieren, wenn nur ein Teilformat unterstützt wird.

9. **Hermes-Agenten-Konsole planen**
    - Interne Bedienkonsole für Hermes Agenten entwerfen.
    - Sichere Befehle für Modellaktionen definieren.
    - Keine direkte Ausführung ungeprüfter Systembefehle erlauben.

10. **Eigenes Erweiterungsformat planen**
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
- **Fail-closed DXF-Einheitenprüfung** — `$INSUNITS=4` wird als Millimeter akzeptiert, fehlende Einheiten werden sichtbar als Millimeter-Annahme gemeldet und bekannte andere Einheiten werden vor Geometrieimport abgelehnt.
- **ASCII-STL-Export für Boxkörper** — einfache STL-Ausgabe für Boxgeometrie.
- **ASCII-STL-Referenzmesh-Import** — synthetische ASCII-STL-Dateien können als nicht editierbare Referenzmeshes mit Dreieckszahl geladen, inspiziert, gerendert und in `.hcad.json` Projekten erhalten werden; Binary-STL und Solid-Healing bleiben bewusst ausgeschlossen.
- **Projektdatei speichern/laden** — `.hcad.json` Snapshot mit Version, Einheit, Elementen und Komponenten.
- **React/Vite-Oberfläche mit Werkzeugleiste** — Bedienoberfläche für die vorhandenen Werkzeuge.
- **Interaktiver Three.js-Viewport mit Picking und Auswahlmarkierung** — Szene aus dem Kernmodell rendern, Objekte anklicken und ausgewählte Elemente sichtbar hervorheben.
- **Axis-aligned Rechteck-Extrusion** — ausgewählte rechteckige, achsenparallele Flächen können mit positiver Millimeterhöhe zu Boxkörpern extrudiert werden.
- **GitHub Actions CI** — Pull Requests und wichtige Branches führen `npm ci` und `npm run check` automatisch aus.
- **Undo/Redo-Verlauf** — Modelländerungen werden als Snapshots historisiert; Rückgängig/Wiederholen ist über eigene UI-Schaltflächen möglich.
- **Selected-Entity-Inspector** — ausgewählte Linien, Flächen und Körper zeigen Maße, Bounding Box und relevante Werte in Millimeter.
- **Maus-Zeichnen mit Live-Vorschau** — Linien und Rechtecke über zwei Rasterklicks zeichnen; Boxkörper über einen Rasterklick mit einstellbaren Standardmaßen erzeugen.
- **Move- und Tape-Workflow im Viewport** — ausgewählte Elemente per Start-/Zielpunkt in Millimeter verschieben und Distanzen über zwei Klicks messen.
- **Auswahl löschen** — ausgewählte Elemente per Button oder Delete/Backspace entfernen; Komponentenreferenzen werden bereinigt.
- **Box-Dimensionspanel** — Standardmaße für neue Boxkörper in Millimeter setzen und ungültige Maße blockieren.
- **Präzises Verschieben** — ausgewählte Elemente per ΔX/ΔY/ΔZ in Millimeter transformieren.
- **Präzises Drehen** — ausgewählte Elemente per Grad-Eingabe um die Z-Achse drehen; Boxen bleiben dabei um ihren sichtbaren Mittelpunkt stabil.
- **Präzises Push/Pull für Boxhöhe** — ausgewählte Boxkörper per ΔH in Millimeter höher oder niedriger machen; ungültige oder auf Null führende Werte werden blockiert.

## Sicherheits- und Realismusregeln

- Keine Unterstützung für SketchUp-Ruby-Plugins (`.rb`, `.rbz`) versprechen.
- Keine native DWG- oder SKP-Kompatibilität behaupten, solange nur eine geplante Bridge existiert.
- Die Benutzeroberfläche darf SketchUp-ähnlich und vertraut wirken, aber keine geschützten SketchUp-/Trimble-Layouts, Logos, Icons, Werkzeug-Symbole oder markenrechtlich geschützten Designs kopieren.
- Werkzeugnamen und Symbole sollen eigenständig gestaltet werden, auch wenn die Bedienlogik für CAD-Nutzer vertraut ist.
- Keine großen Binärdateien, generierten Ordner oder unnötigen Build-Artefakte committen.
- Keine Zugangsdaten, Tokens oder privaten Dateien committen.
- Keine Funktion als fertig dokumentieren, wenn sie nur teilweise funktioniert.

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
