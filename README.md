# Hermes CAD Sketcher

**Wichtig für Hermes Agenten, andere KI-Agenten und Contributor:** Lies zuerst [`AGENTS.md`](AGENTS.md). `AGENTS.md` ist die verbindliche Quelle für Agentenarbeit. Dort stehen die Regeln für Erweiterungen, Branches, Tests, Commits, Dokumentation und Repository-Sicherheit.

**Hermes CAD Sketcher** ist ein leichtes, SketchUp-ähnliches Linux-CAD-Projekt für Marios und EF-Sinn. Es läuft lokal im Browser, arbeitet in Millimeter und soll einfache Körper schnell zeichnen, auswählen, verschieben, drehen, messen, speichern und in ehrlich unterstützte CAD-Austauschformate exportieren.

Das Ziel ist **nicht**, SketchUp-Plugins (`.rb`, `.rbz`) nachzubauen. Diese Plugin-Kompatibilität ist absichtlich ausgeschlossen. Das Ziel ist ein stabiles, offenes Linux-Werkzeug für echte Arbeit mit Maßen.

## Schnellstart auf Linux

Voraussetzung: Node.js 20 oder neuer.

```bash
npm ci
npm run dev
```

Danach die von Vite angezeigte lokale URL im Browser öffnen.

Pflichtprüfung vor Commit oder Pull Request:

```bash
npm run check
```

`npm run check` führt aus:

1. `npm run test`
2. `npm run build`

Für eine lokale Produktionsvorschau:

```bash
npm run build
npm run preview
```

## Aktueller Stand: v0.2-Entwicklungsstand

Der aktuelle geprüfte Entwicklungsstand ist kein fertiges Produktions-CAD, aber bereits ein nutzbarer Browser-Prototyp für millimetergenaue Grundformen und einfache Transformationsarbeit.

Vorhanden im Code:

- Kernmodell in TypeScript
- Millimeter als feste Basiseinheit
- Linien, Rechtecke/Flächen und Boxkörper
- interaktiver Three.js-Viewport
- Orbit/View-Drehung mit rechter Maustaste
- Auswahl/Picking im Viewport mit sichtbarer Markierung
- Zeichnen direkt auf dem Millimeter-Raster:
  - Linie über zwei Klicks
  - Rechteck über zwei Klicks
  - Box über einen Klick mit einstellbaren Standardmaßen
- Live-Vorschau beim Zeichnen von Linien und Rechtecken
- Verschieben per Maus über Start-/Zielpunkt
- präzises Verschieben per ΔX/ΔY/ΔZ in mm
- präzises Drehen um die Z-Achse in Grad
- präzises Push/Pull für Boxhöhe per ΔH in mm
- Löschen der Auswahl per Button oder Tastatur
- Box-Dimensionspanel für neue Boxen
- Komponenten/Gruppen und Komponenten-Duplizierung mit Millimeter-Versatz
- Maßband-Workflow mit Millimeteranzeige
- `.hcad.json` Projektdatei-Export und -Import mit Versions- und Einheitenprüfung
- DXF-Export-Grundlage in der UI und einfacher DXF-LINE-Import im Kernmodell
- ASCII-STL-Export für Boxkörper
- lokale Vitest-Tests plus Production-Build über `npm run check`

Zuletzt verifizierter Stand des Produkt-Slice-Branches:

- Branch: `review/product-slices-on-dev`
- Basis: `dev/v0.2`
- Test-/Build-Gate: `npm run check` grün
- Preview-Smoke: lokale Vite-Preview liefert die App aus
- bekannte, nicht blockierende Warnung: Vite meldet wegen Three.js einen großen JS-Chunk nach Minifizierung

## Unterstützte Workflows

### Zeichnen

1. Werkzeug `Linie`, `Quadrat/Rechteck` oder `Körper` wählen.
2. Im Viewport auf das Raster klicken.
3. Bei Linie/Rechteck den zweiten Punkt klicken; bei Körper reicht ein Punkt.
4. Für Körper vorher optional Breite, Tiefe und Höhe im Box-Dimensionspanel einstellen.

### Auswählen und Bearbeiten

- `Auswahl`: Objekt im Viewport anklicken.
- `Verschieben`: Objekt auswählen, Werkzeug aktivieren, Start- und Zielpunkt auf dem Raster klicken.
- Präzises Verschieben: ΔX/ΔY/ΔZ in mm eingeben und anwenden.
- Präzises Drehen: Winkel in Grad eingeben und anwenden.
- Push/Pull: Box auswählen, ΔH in mm eingeben und anwenden.
- Auswahl löschen: Button `Auswahl löschen` oder Delete/Backspace.

### Messen

- `Maßband` wählen.
- Zwei Punkte auf dem Raster anklicken.
- Die Distanz erscheint in der Statusleiste in Millimeter.

### Speichern und Laden

- `Projekt speichern` lädt eine lokale `.hcad.json` Datei herunter.
- `Projekt laden` importiert eine vorher gespeicherte `.hcad.json` Datei.
- Das Projektformat prüft Formatversion, Einheit, Elemente und Komponentenreferenzen.

### Export

- `DXF exportieren`: exportiert einfache Linien-/Rechteck-Geometrie als DXF-Grundlage.
- `STL exportieren`: exportiert Boxkörper als ASCII-STL.

## Datei-Formate

### Aktuell unterstützt

- `.hcad.json`: Hermes-Projektsnapshot mit Version, Einheit, Elementen und Komponenten.
- `.dxf`: einfacher Export in der UI und einfacher LINE-Import im Kernmodell.
- `.stl`: ASCII-STL-Export für Boxkörper.

### Geplant

- Erweiterter DXF-Import, z. B. LWPOLYLINE, Layer und Einheitenprüfung.
- ASCII-STL-Import als Referenzmesh.
- `.obj`, `.glb`, `.ifc`, `.step` nur nach realistischer technischer Prüfung.

### Nur über externe Bridge realistisch

- `.dwg`: über LibreDWG, ODA File Converter oder andere Bridge.
- `.skp`: über offizielle SketchUp C API oder Export-Workflow.

### Absichtlich nicht unterstützt

- `.rb` SketchUp-Ruby-Plugins
- `.rbz` SketchUp-Erweiterungspakete
- Extension-Warehouse-Kompatibilität

## Warum keine `.rb` / `.rbz` Unterstützung?

SketchUp-Plugins laufen gegen die SketchUp Ruby API. Diese API existiert innerhalb von SketchUp. Ein eigenes Linux-CAD-Programm müsste dafür große Teile von SketchUp selbst nachbauen. Das wäre nicht sinnvoll für dieses Projekt.

Hermes CAD Sketcher kann später ein eigenes Erweiterungsformat bekommen, aber es wird keine fremde Plugin-API vortäuschen.

## Bekannte Grenzen

Noch nicht fertig oder nur teilweise vorhanden:

- freie Flächenbearbeitung wie in einem vollständigen CAD-System
- Push/Pull aus beliebigen Rechtecken oder Flächen in Breite/Tiefe/Höhe
- vollständiger DXF-Import
- STL-Import
- DWG-Import/Export
- SKP-Import/Export
- produktionsreife Datei-Kompatibilität mit externen CAD-Systemen
- Linux-Desktop-Paketierung, z. B. Tauri/AppImage
- Bundle-Größenoptimierung für den Three.js-Chunk

## Qualitätsregel für Hermes Agenten und menschliche Contributor

Dieses Repository darf nicht mit ungeprüftem Code gefüllt werden. Jeder Agent und jeder Mensch muss vor einem Commit lokal prüfen, dass das gesamte Programm weiterhin funktioniert.

### Pflicht vor jedem Commit

```bash
npm run check
```

Wenn der Check fehlschlägt:

1. nicht committen,
2. Fehler verstehen,
3. Code verbessern,
4. `npm run check` erneut laufen lassen,
5. erst committen, wenn alles grün ist.

### Branch-Regeln

`AGENTS.md` ist für Branch-Entscheidungen verbindlich. Kurzfassung:

- Kein direkter Push auf `main`.
- `main` bleibt stabil und geprüft.
- Normale neue Erweiterungen landen zuerst auf einem aktiven Versionsbranch, zum Beispiel `dev/v0.2`.
- Kurzlebige `feat/...`, `fix/...`, `docs/...`, `test/...` oder `refactor/...` Branches nur nutzen, wenn die Arbeit klar abgegrenzt ist oder parallel/external als PR vorbereitet wird.
- Ohne ausdrückliche Autorisierung keine Branches im offiziellen Remote erstellen und nicht pushen.

### Commit-Regeln

- Conventional Commits verwenden.
- Beispiele:
  - `feat: add rectangle drawing tool`
  - `fix: preserve millimeter units in dxf export`
  - `docs: document v0.2 product workflows`

### Pull-Request-Regeln

Jeder Pull Request muss enthalten:

- Was wurde geändert?
- Welche Dateien/Formate sind betroffen?
- Wie wurde lokal geprüft?
- Ausgabe von `npm run check`
- Bekannte Grenzen oder Risiken

## Architektur

```text
src/core/
  geometry.ts     Vektoren, Maße, Rotation, Bounding Boxes
  model.ts        CAD-Kernmodell: Elemente, Komponenten, Werkzeuge
  dxf.ts          DXF Import/Export-Grundlage
  stl.ts          STL Export-Grundlage
  projectFile.ts  Lokales .hcad.json Projektformat
  toolState.ts    reine Werkzeugzustände für Zeichen-/Mess-/Move-Flows

src/ui/
  ThreeViewport.tsx      Three.js-Viewport und Mausinteraktion
  sceneAdapter.ts        Übersetzung Kernmodell -> Three.js Objekt
  drawingController.ts   geprüfte Eingaben für Linien/Rechtecke/Boxen
  MovePanel.tsx          präzise mm-Verschiebung
  RotatePanel.tsx        präzise Grad-Rotation
  PushPullPanel.tsx      präzise Boxhöhenänderung
  BoxDimensionsPanel.tsx Maße für neue Boxen

src/App.tsx       React-Oberfläche und Werkzeugleiste
tests/            Vitest-Tests für Modell, UI-Helfer, Viewport und Formate
```

## Grundsatz

Dieses Projekt soll langsam, sauber und verlässlich wachsen. Für EF-Sinn und technische Arbeit gilt:

**Maße zuerst. Optik danach. Keine falsche Datei-Kompatibilität versprechen.**
