# Hermes CAD Sketcher

**Wichtig für Hermes Agenten, andere KI-Agenten und Contributor:** Lies zuerst [`AGENTS.md`](AGENTS.md). Dort stehen die verbindlichen Regeln für neue Erweiterungen, Funktionen und Werkzeuge: stabile Branch-/Versionsstrategie, keine ungeprüften Commits, immer `npm run check`, keine unautorisierten Änderungen am Hauptprojekt, Aufgabenliste pflegen und erledigte Erweiterungen dokumentieren.

**Hermes CAD Sketcher** ist ein neues Linux-CAD-Projekt für Marios und EF-Sinn: ein leichtes, SketchUp-ähnliches Programm für Ubuntu, mit dem man Körper schnell zeichnen, verschieben, drehen, messen, gruppieren und später in wichtige CAD-Formate importieren/exportieren kann.

Das Ziel ist **nicht**, SketchUp-Plugins (`.rb`, `.rbz`) nachzubauen. Diese Plugin-Kompatibilität ist absichtlich ausgeschlossen. Das Ziel ist ein stabiles, offenes Linux-Werkzeug für echte Arbeit mit Maßen.

## Zielbild

Hermes CAD Sketcher soll sich für Marios ungefähr so anfühlen:

- Linien zeichnen
- Rechtecke/Quadrate zeichnen
- einfache Körper erstellen
- Flächen ziehen/drücken, ähnlich Push/Pull
- Elemente verschieben
- Komponenten/Gruppen erstellen
- Elemente drehen
- Maßband verwenden
- Ansicht drehen/orbiten, auch mit rechter Maustaste
- Modelle importieren, prüfen, bearbeiten und exportieren
- alles in Millimeter, mit sicherer Maßkontrolle

## Aktueller Stand: MVP 0.1

Der erste Stand ist bewusst klein, testbar und erweiterbar.

Vorhanden im Code:

- Kernmodell in TypeScript
- Millimeter als feste Basiseinheit
- Linien
- Rechtecke
- Box/Körper
- Verschieben
- Drehen um Z-Achse
- Push/Pull-Grundfunktion für Körperhöhe
- Komponenten/Gruppen
- Maßband-Funktion
- DXF-Export-Grundlage
- einfacher DXF-LINE-Import
- ASCII-STL-Export für Boxkörper
- React/Vite-Oberfläche mit Werkzeugleiste
- lokale Tests mit Vitest

Noch nicht fertig:

- echter interaktiver 3D-Viewport mit Picking
- Zeichnen direkt mit Maus im 3D-Raum
- freie Flächenbearbeitung
- vollständiger DXF-Import
- DWG-Import/Export
- SKP-Import/Export
- Produktivreife Datei-Kompatibilität

## Datei-Formate

### MVP

- `.dxf`: einfacher Export und LINE-Import
- `.stl`: ASCII-STL-Export für Boxkörper

### Geplant

- `.obj`
- `.glb`
- `.ifc`
- `.step`

### Nur über externe Bridge realistisch

- `.dwg`: über LibreDWG, ODA File Converter oder andere Bridge
- `.skp`: über offizielle SketchUp C API oder Export-Workflow

### Absichtlich nicht unterstützt

- `.rb` SketchUp-Ruby-Plugins
- `.rbz` SketchUp-Erweiterungspakete
- Extension-Warehouse-Kompatibilität

## Warum keine `.rb` / `.rbz` Unterstützung?

SketchUp-Plugins laufen gegen die SketchUp Ruby API. Diese API existiert innerhalb von SketchUp. Ein eigenes Linux-CAD-Programm müsste dafür große Teile von SketchUp selbst nachbauen. Das wäre nicht sinnvoll für dieses Projekt.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Lokale Prüfung:

```bash
npm run check
```

`npm run check` führt aus:

1. `npm run test`
2. `npm run build`

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

- Kein direkter Push auf `main`.
- Neue Arbeit immer auf einem eigenen Branch.
- Branch-Namen:
  - `feat/...` für neue Funktionen
  - `fix/...` für Fehlerbehebungen
  - `docs/...` für Dokumentation
  - `test/...` für Tests
  - `refactor/...` für Umbau ohne neue Funktion

### Commit-Regeln

- Conventional Commits verwenden.
- Beispiele:
  - `feat: add rectangle drawing tool`
  - `fix: preserve millimeter units in dxf export`
  - `test: cover component grouping`

### Pull-Request-Regeln

Jeder Pull Request muss enthalten:

- Was wurde geändert?
- Welche Dateien/Formate sind betroffen?
- Wie wurde lokal geprüft?
- Ausgabe von `npm run check`
- Bekannte Grenzen oder Risiken

### Agenten-Aufgabenliste

Gute nächste Aufgaben für Hermes Agenten oder GitHub User:

1. **Echter Three.js-Viewport**
   - Szene aus `SketchModel` rendern.
   - Rechte Maustaste soll Orbit/View drehen.
   - Linke Maustaste soll auswählen.
   - Test: Rendering-Adapter und Tool-State prüfen.

2. **Maus-Zeichnen im 3D-Raum**
   - Grid-Snapping in Millimeter.
   - Linie durch zwei Klicks.
   - Rechteck durch zwei Punkte.
   - Test: Koordinatenumrechnung und Snap-Regeln.

3. **Push/Pull für Flächen**
   - Aus Rechteck eine Box extrudieren.
   - Box-Flächen in Höhe/Tiefe/Breite ziehen.
   - Test: Maße bleiben korrekt.

4. **Komponenten verbessern**
   - Komponenten duplizieren.
   - Verschachtelte Komponenten vorbereiten.
   - Test: IDs und Transformationen bleiben stabil.

5. **DXF verbessern**
   - LWPOLYLINE importieren.
   - Layer auslesen.
   - Einheiten prüfen.
   - Testdateien unter `tests/fixtures/` ergänzen.

6. **STL Import ergänzen**
   - ASCII-STL lesen.
   - Mesh als Referenzkörper anzeigen.
   - Test: bekannte STL-Datei ergibt erwartete Dreieckszahl.

7. **DWG Bridge planen**
   - LibreDWG/ODA-Workflow dokumentieren.
   - Keine falsche native DWG-Unterstützung behaupten.
   - Test: Bridge-Adapter muss fehlende Tools sauber melden.

8. **SKP Bridge planen**
   - Offizielle SketchUp C API prüfen.
   - Lizenz und Linux-Build realistisch dokumentieren.
   - Test: Adapter-Interface ohne SketchUp-Abhängigkeit.

## Architektur

```text
src/core/
  geometry.ts   Vektoren, Maße, Rotation, Bounding Boxes
  model.ts      CAD-Kernmodell: Elemente, Komponenten, Werkzeuge
  dxf.ts        DXF Import/Export-Grundlage
  stl.ts        STL Export-Grundlage

src/ui/
  sceneAdapter.ts  Übersetzung Kernmodell -> Three.js Objekt

src/App.tsx     React-Oberfläche und Werkzeugleiste
tests/          Vitest-Tests für Geometrie und Formate
```

## Grundsatz

Dieses Projekt soll langsam, sauber und verlässlich wachsen. Für EF-Sinn und technische Arbeit gilt:

**Maße zuerst. Optik danach. Keine falsche Datei-Kompatibilität versprechen.**
