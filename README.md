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
- anpassbare obere Schnell-Werkzeugleiste mit kleinen Icons, Drag-and-drop-Reihenfolge und Tastenkürzeln
- SketchUp-inspirierter, aber eigenständig gestalteter klassischer CAD-Arbeitsplatz ganz oben mit Menüleiste; jeder Menübutton öffnet seinen passenden Funktionsbereich, z. B. `Datei` für Datei & Import/Export und `Bearbeiten` für Bearbeiten & Maße
- Bearbeiten-Menü zeigt zuerst Button-Verknüpfungen; die eigentlichen Bearbeiten-/Maße-/Inspektor-Funktionen öffnen danach als verschiebbare, minimierbare und per CSS-Griff skalierbare Fenster
- seitliche Arbeitsleiste als reine Icon-Leiste für schnelle Werkzeugwahl; ausführliche Eingabe- und Dateifunktionen sitzen oben im passenden Menübereich oder in externen Fenstern
- linke Maustaste führt die Standardaktion des aktiven Werkzeugs aus: Auswahl anklicken, Linien/Körperpunkte setzen, Körperflächen auswählen und anschließend ziehen
- Mausrad-Zoom im 3D-Arbeitsbereich: der Punkt unter der Maus wird als Zoom-Fokus verwendet
- Linien und Körper liefern Fangpunkte an Anfang, Ende und Mitte; Körper werden im Viewport als Linien-/Flächen-Skelett aufgebaut, bleiben aber als später vollkörperfähige Boxdaten erhalten
- normaler Pfeil-Mausanzeiger ohne dauerhaftes Werkzeug-Symbol neben dem Pfeil; Spezialanzeigen können später gezielt pro Funktion ergänzt werden
- Nullpunkt-Hilfslinien im Viewport mit roten, grünen und blauen Achsfarben
- Einheitenfeld unten rechts mit aktuellem Maß, Linienlänge, Körpermaß und Flächenanzeige in m²
- AI-Chat als eigenes Fenster, standardmäßig geschlossen, damit er die Arbeitsfläche nicht blockiert
- Zeichnen direkt auf dem Millimeter-Raster:
  - Linie über zwei Klicks
  - Rechteck über zwei Klicks
  - Box über einen Klick mit einstellbaren Standardmaßen
- Live-Vorschau beim Zeichnen von Linien und Rechtecken
- Verschieben per Maus über Start-/Zielpunkt
- präzises Verschieben per ΔX/ΔY/ΔZ in mm
- präzises Drehen um die Z-Achse in Grad
- präzises Push/Pull für Boxhöhe per ΔH in mm
- direkte Bearbeitung der Maße ausgewählter Boxkörper
- Extrusion ausgewählter axis-aligned Rechteckflächen zu Boxkörpern
- Löschen der Auswahl per Button oder Tastatur
- Undo/Redo-Verlauf für Modelländerungen über Rückgängig/Wiederholen
- Box-Dimensionspanel für neue Boxen
- Komponenten/Gruppen und Komponenten-Duplizierung mit Millimeter-Versatz
- Maßband-Workflow mit Millimeteranzeige
- `.hcad.json` Projektdatei-Export und -Import mit Versions- und Einheitenprüfung
- DXF-Export-Grundlage in der UI, DXF-Dateiimport in der UI mit Importbericht, fail-closed Einheitenprüfung, einfacher DXF-LINE-Import und begrenzter DXF-LWPOLYLINE-Rechteckimport
- ASCII-STL-Export für Boxkörper und ASCII-STL-Referenzmesh-Import ohne editierbare Solid-Konvertierung
- Ruby-Konsole als sichere Hermes-CAD-Befehls-DSL für `line`, `rectangle`, `box`, `move`, `rotate_z`, `resize`, `push_pull`, `extrude`, `delete`, `component`, `duplicate_component`, `select` und `list`; agentisch per `box`/`extrude` erstellte Körper werden automatisch als eigene Komponenten geführt
- Hermes-Agent-Bridge über die gleiche CAD-App-Adresse (`/hermes-cad/agent`): die Browser-App spricht nicht direkt mit einem API-Key, sondern mit der Bridge des PCs, der die CAD-Seite ausliefert. Dadurch kann Marios denselben CAD-Host auch von seinem zweiten PC nutzen; die eigentliche Bridge bleibt auf dem Host lokal an `127.0.0.1:8766` gebunden.
- lokale Vitest-Tests plus Production-Build über `npm run check`
- GitHub Actions CI für Pull Requests und zentrale Branches

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
- Auswahlmaße bearbeiten: Box auswählen, Breite/Tiefe/Höhe direkt in mm setzen.
- Fläche extrudieren: axis-aligned Rechteck/Fläche auswählen, positive Höhe eingeben und zu einem Boxkörper extrudieren.
- Rückgängig/Wiederholen: Modelländerungen mit den Schaltflächen `Rückgängig` und `Wiederholen` reversibel machen.
- Auswahl löschen: Button `Auswahl löschen` oder Delete/Backspace.

### Messen

- `Maßband` wählen.
- Zwei Punkte auf dem Raster anklicken.
- Die Distanz erscheint in der Statusleiste in Millimeter.

### Speichern und Laden

- `Projekt speichern` lädt eine lokale `.hcad.json` Datei herunter.
- `Projekt laden` importiert eine vorher gespeicherte `.hcad.json` Datei.
- Das Projektformat prüft Formatversion, Einheit, Elemente und Komponentenreferenzen.
- `DXF laden` importiert nur die dokumentierte MVP-Teilmenge: `LINE` und geschlossene, vierpunktige, achsenparallele `LWPOLYLINE`-Rechtecke ohne Bulge, Breite, Dicke oder Sonder-Extrusionsvektor. `$INSUNITS=4` wird als Millimeter akzeptiert; fehlende `$INSUNITS` werden sichtbar als Millimeter-Annahme gemeldet; bekannte andere Einheiten werden vor Geometrieimport abgelehnt. Andere DXF-Entitäten werden übersprungen und im Status als übersprungen gezählt.

### Ruby-Konsole und lokaler Hermes-Agent

Die Ruby-Konsole ist keine SketchUp-Ruby-API und lädt keine `.rb`/`.rbz` Plugins. Sie ist eine sichere Hermes-CAD-Befehls-DSL, die absichtlich nur die vorhandenen Modellfunktionen ausführt und immer in Millimeter arbeitet. Körper, die über `box` oder `extrude` entstehen, werden automatisch in eine eigene Komponente gelegt; mehrere agentisch erzeugte Bauteile bleiben dadurch getrennt auswählbar, verschiebbar und später für Zuschnitt-/Stücklisten-Metadaten vorbereitet.

Beispiele:

```ruby
line(0, 0, 0, 1000, 0, 0)
rectangle(0, 0, 0, 1200, 600)
box(0, 0, 0, 600, 400, 200)
move(selected, 100, 0, 0)
rotate_z(selected, 90)
resize(selected, width: 800, depth: 450, height: 250)
push_pull(selected, 50)
extrude(selected, 300)
delete(selected)
```

Der Hermes-Agent im Programm läuft nicht als Browser-API-Key. Die Oberfläche spricht über die gleiche CAD-App-Adresse mit `/hermes-cad/agent`; der Vite-Dev-Server leitet diese Anfragen auf dem CAD-Host an die lokal gebundene Bridge `http://127.0.0.1:8766/hermes-cad/agent` weiter. Dadurch kann derselbe User die CAD-Seite auch von einem zweiten PC öffnen, ohne dass der Browser auf diesem zweiten PC eine eigene Bridge braucht. Die Bridge übergibt Modell-Snapshot, Auswahl und Zeichnungsmodus an Hermes und erwartet eine sichere JSON-Antwort. Normale Nachrichten werden wie im Telegram-Chat beantwortet; wenn Hermes eine CAD-Aktion ausführen soll, liefert er zusätzlich erlaubte CAD-Befehle zurück.

Start der lokalen Bridge auf dem CAD-App-Host:

```bash
npm run agent:bridge
```

### Export

- `DXF exportieren`: exportiert einfache Linien-/Rechteck-Geometrie als DXF-Grundlage.
- `STL exportieren`: exportiert Boxkörper als ASCII-STL.

## Datei-Formate

### Aktuell unterstützt

- `.hcad.json`: Hermes-Projektsnapshot mit Version, Einheit, Elementen und Komponenten.
- `.dxf`: einfacher Export in der UI, einfacher UI-Import mit Statusbericht, fail-closed `$INSUNITS`-Prüfung, `LINE` und begrenzter Import geschlossener, vierpunktiger, achsenparalleler LWPOLYLINE-Rechtecke ohne Bulge/Breite/Dicke/Sonder-Extrusionsvektor; Layernamen dieser MVP-Entitäten bleiben als Metadaten erhalten und werden im Inspector sowie beim DXF-Export wieder ausgegeben.
- `.stl`: ASCII-STL-Export für Boxkörper und ASCII-STL-Import als nicht editierbares Referenzmesh mit Dreieckszahl; kein Binary-STL, kein Solid-Healing und keine Konvertierung in editierbare Körper.

### Geplant

- Erweiterter DXF-Import über den aktuellen LINE- und begrenzten LWPOLYLINE-Rechteckimport hinaus, z. B. bewusst designte Einheitenkonvertierung und weitere Entitäten.
- Binary-STL-Import und weitere Referenzmesh-Metadaten nur nach fail-closed Tests.
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
- beliebig rotierte oder freie Flächenextrusion; aktuell ist nur axis-aligned Rechteck-zu-Box-Extrusion implementiert
- Push/Pull aus beliebigen Rechtecken oder Flächen in Breite/Tiefe/Höhe
- vollständiger DXF-Import; aktuell nur einfacher LINE-Import und begrenzte geschlossene, achsenparallele Vierpunkt-LWPOLYLINE-Rechtecke
- editierbarer STL-Import; aktuell kann ASCII-STL nur als nicht editierbares Referenzmesh geladen werden
- Binary-STL-Import
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
  cadCommands.ts  Ruby-Konsole-DSL und Agent-Chat-Brücke für live CAD-Befehle
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
