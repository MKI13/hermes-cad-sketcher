# Anleitung für Hermes Agenten und Contributor

Diese Datei ist Pflichtlektüre für alle Hermes Agenten, andere KI-Agenten und menschliche Contributor, die neue Erweiterungen, Funktionen oder Werkzeuge für **Hermes CAD Sketcher** schreiben.

Ziel: Neue Erweiterungen dürfen nicht nur einzeln funktionieren. Sie müssen sauber in das gesamte Programm passen, lokal geprüft sein und nachvollziehbar dokumentiert werden.

## Grundregel

**Kein Commit und kein Pull Request, wenn das Gesamtprogramm nicht geprüft wurde.**

Vor jedem Commit muss mindestens laufen:

```bash
npm run check
```

`npm run check` führt die Tests und den Production-Build aus. Wenn dieser Check fehlschlägt, darf nicht committed werden.

## Pflicht-Workflow für neue Erweiterungen

1. **Repository verstehen**
   - Lies zuerst `README.md` und diese Datei vollständig.
   - Prüfe die bestehende Architektur, bevor du neue Dateien oder neue Patterns einführst.
   - Bestehende Kernlogik liegt vor allem unter `src/core/`.
   - UI- und Viewport-Logik liegt vor allem unter `src/ui/` und `src/App.tsx`.
   - Tests liegen unter `tests/`.

2. **Aufgabe klar abgrenzen**
   - Arbeite pro Branch nur an einer klaren Erweiterung oder einem klaren Werkzeug.
   - Keine zufälligen Nebenänderungen.
   - Keine großen Umbauten, wenn eine kleine, getestete Erweiterung reicht.

3. **Tests mitdenken, nicht nachträglich raten**
   - Neue Kernfunktionen brauchen Tests.
   - Neue Import-/Export-Funktionen brauchen Testdaten oder strukturierte Beispieltests.
   - Neue Werkzeug-Zustände sollen möglichst als reine Funktionen testbar sein.
   - UI-Änderungen sollen die zugrunde liegende Logik nicht untestbar machen.

4. **Integration prüfen**
   - Die Erweiterung muss mit dem vorhandenen Modell, den Einheiten und den vorhandenen Werkzeugen zusammenarbeiten.
   - Millimeter bleiben die Basiseinheit.
   - IDs, Komponenten, Transformationen und Projektdateien dürfen nicht kaputtgehen.
   - Keine falsche Kompatibilität versprechen, besonders nicht bei DWG, SKP, RB oder RBZ.

5. **Gesamtprüfung ausführen**
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

6. **Dokumentation aktualisieren**
   - Wenn eine geplante Erweiterung umgesetzt wurde, streiche sie aus der Liste `Geplante Erweiterungen` oder markiere sie dort als erledigt.
   - Füge sie unter `Erledigte Funktionen und Werkzeuge` mit kurzer Beschreibung hinzu.
   - Wenn sich Bedienung, Datei-Formate oder Grenzen ändern, aktualisiere auch `README.md`.

7. **Commit sauber beschreiben**
   - Commit-Nachricht muss sagen, was die Erweiterung genau macht.
   - Gute Beispiele:
     - `feat: add snap-aware rectangle drawing`
     - `feat: add project save and load workflow`
     - `fix: keep millimeter units stable during dxf import`
     - `test: cover viewport picking entity mapping`
   - Schlechte Beispiele:
     - `update`
     - `changes`
     - `work`

## Branch- und Repository-Regeln

- Kein direkter Push auf `main`.
- Neue Arbeit immer auf einem eigenen Branch.
- Branch-Namen:
  - `feat/...` für neue Funktionen,
  - `fix/...` für Fehlerbehebungen,
  - `docs/...` für Dokumentation,
  - `test/...` für reine Tests,
  - `refactor/...` für Umbau ohne neue Funktion.

## Qualitätsmaßstab

Eine Erweiterung gilt erst als fertig, wenn alle Punkte erfüllt sind:

- Die Funktion ist in der Oberfläche oder im Kernmodell nutzbar, je nach Aufgabe.
- Die Funktion arbeitet mit bestehenden Funktionen zusammen.
- Es gibt passende Tests oder eine klare Begründung, warum ein Teil nicht automatisch testbar ist.
- `npm run check` ist erfolgreich durchgelaufen.
- Dokumentation und Aufgabenlisten sind aktualisiert.
- Der Commit beschreibt die Änderung konkret.

## Geplante Erweiterungen

Diese Liste ist eine Arbeitsliste für zukünftige Agenten und Contributor. Wenn eine Erweiterung fertig ist, verschiebe sie in die erledigte Liste.

1. **Push/Pull für Flächen verbessern**
   - Rechtecke und Flächen kontrolliert extrudieren.
   - Negative oder Null-Extrusion sauber blockieren.
   - Maße müssen in Millimeter stabil bleiben.

2. **Komponenten verbessern**
   - Komponenten duplizieren.
   - Verschachtelte Komponenten vorbereiten.
   - Komponenten als Instanzen mit eigener Transformation modellieren.

3. **DXF-Import erweitern**
   - LWPOLYLINE importieren.
   - Layer auslesen.
   - Einheiten prüfen.
   - Testdateien unter `tests/fixtures/` ergänzen.

4. **STL-Import ergänzen**
   - ASCII-STL lesen.
   - Mesh als Referenzkörper anzeigen.
   - Bekannte STL-Testdatei mit erwarteter Dreieckszahl prüfen.

5. **Bundle-Größe reduzieren**
   - Three.js-Viewport dynamisch laden oder Vite-Code-Splitting nutzen.
   - Build-Warnungen dokumentieren oder reduzieren.

6. **DWG-Bridge planen**
   - Realistischen Workflow über LibreDWG, ODA File Converter oder andere Bridge dokumentieren.
   - Keine native DWG-Unterstützung behaupten, solange sie nicht wirklich existiert.

7. **SKP-Bridge planen**
   - Offizielle SketchUp C API und Lizenzlage prüfen.
   - Linux-Build realistisch bewerten.
   - Adapter-Interface ohne SketchUp-Abhängigkeit testbar halten.

8. **GitHub Actions CI aktivieren**
   - CI soll `npm ci` und `npm run check` ausführen.
   - Nur mit GitHub-Token/Workflow-Rechten ändern.

9. **Weitere Werkzeuglogik aus React lösen**
   - Select, Move, Rotate und weitere Werkzeugaktionen als reine Funktionen testbar machen.
   - React soll möglichst nur Darstellung und Event-Anbindung übernehmen.

10. **Dateiformate erweitern**
    - `.obj`, `.glb`, `.ifc` oder `.step` nur nach realistischer technischer Prüfung ergänzen.
    - Import/Export nie als fertig markieren, wenn nur ein Teilformat unterstützt wird.

## Erledigte Funktionen und Werkzeuge

Diese Liste soll nach jedem erfolgreichen Feature-Commit gepflegt werden.

- **Kernmodell in TypeScript** — Grundstruktur für CAD-Elemente und Operationen.
- **Millimeter als Basiseinheit** — Maße werden im Modell einheitlich in Millimeter geführt.
- **Linien, Rechtecke und Boxkörper** — Grundelemente für das Zeichnen.
- **Verschieben und Drehen um Z-Achse** — Basis-Transformationen im Modell.
- **Push/Pull-Grundfunktion für Körperhöhe** — einfache Höhenänderung für Boxkörper.
- **Komponenten/Gruppen** — Elemente können gruppiert werden.
- **Maßband-Grundfunktion** — Distanzen können berechnet und angezeigt werden.
- **DXF-Export-Grundlage und einfacher DXF-LINE-Import** — erster Austausch mit DXF-Linien.
- **ASCII-STL-Export für Boxkörper** — einfache STL-Ausgabe für Boxgeometrie.
- **Projektdatei speichern/laden** — `.hcad.json` Snapshot mit Version, Einheit, Elementen und Komponenten.
- **React/Vite-Oberfläche mit Werkzeugleiste** — Bedienoberfläche für die vorhandenen Werkzeuge.
- **Interaktiver Three.js-Viewport, Maus-Zeichnen, Live-Vorschau, Move und Tape-Workflow** — begonnen bzw. teilweise umgesetzt auf dem vorhandenen Feature-Stand; vor dem Verschieben nach `main` immer aktuellen Code und Tests prüfen.

## Sicherheits- und Realismusregeln

- Keine Unterstützung für SketchUp-Ruby-Plugins (`.rb`, `.rbz`) versprechen.
- Keine native DWG- oder SKP-Kompatibilität behaupten, solange nur eine geplante Bridge existiert.
- Keine großen Binärdateien, generierten Ordner oder unnötigen Build-Artefakte committen.
- Keine Zugangsdaten, Tokens oder privaten Dateien committen.
- Keine Funktion als fertig dokumentieren, wenn sie nur teilweise funktioniert.

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
