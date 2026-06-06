# Verbesserungsplan für bestehende Funktionen

## Priorität 0: Qualitäts- und Versionierungsgrundlage

Bevor neue CAD-Features weiter ausgebaut werden:

- `npm run check` muss grün sein.
- Browser-Smoke muss auf CAD-Host lauffähig oder mit Begründung dokumentiert sein.
- CHANGELOG muss existieren und gepflegt werden.
- Jede Issue bekommt Claim-Kommentar und Proof-Kommentar.
- Jede UI-Funktion bekommt Status: ready / experimental / planned.

## Priorität 1: Modellkern und Befehlsarchitektur

### Undo/Redo

Problem:
- Snapshot-Undo ist gut für MVP, aber langfristig zu grob.

Ziel:
- explizite `CadCommand`-Architektur:
  - `execute`
  - `undo`
  - `redo`
  - `affectedEntityIds`
  - `label`
  - `timestamp`
  - `source: ui | agent | console | import`

Akzeptanz:
- Jede mutierende Funktion läuft durch Command.
- Undo/Redo funktioniert für UI, Agent-DSL und Import.
- Tests zeigen, dass Selection/ActiveContext stabil bleibt.

### Modell-IDs

Ziel:
- stabile IDs für Entities, Definitionen, Instanzen, Groups, Materials, Tags.
- Keine ID-Kollision nach Import/Undo/Redo.

Tests:
- Save/Load/Undo/Redo/Import dürfen IDs nicht beschädigen.

## Priorität 2: Auswahl und Edit-Kontext

### Select

Ziel:
- Root-Kontext: lose Geometrie und Objekte auswählbar.
- In Gruppe/Komponente: nur Geometrie des aktiven Kontextes.
- Außerhalb: innere Geometrie geschützt.

UI:
- Bounding Box für Objekt.
- Face/Edge Highlight im aktiven Kontext.
- Breadcrumb oben oder Statusleiste.

Tests:
- Klick auf innere Face außerhalb Kontext wählt Instanz, nicht Face.
- Doppelklick öffnet Kontext.
- `Esc` oder Close verlässt Kontext.

## Priorität 3: Komponenten/Gruppen

### Komponenten aktuell verbessern

Zielmodell:
```ts
type ComponentDefinition = {
  id: string
  name: string
  entities: Entity[]
  nestedDefinitions?: string[]
  localAxes: Axes
  metadata?: WoodworkingMetadata
}

type ComponentInstance = {
  id: string
  definitionId: string
  transform: Transform
  name?: string
  tagId?: string
  materialOverride?: string
  hidden?: boolean
  locked?: boolean
}
```

Muss können:
- Create Component from selection
- Create Group from selection
- Open context
- Close context
- Duplicate instance
- Move instance
- Rotate instance
- Scale/Resize only where semantically allowed
- Make Unique
- Explode
- Rename definition vs instance eindeutig

SketchUp-Parität:
- Definition bearbeiten ändert alle Instanzen.
- Instanz transformieren ändert nicht Definition.
- Make Unique trennt die Instanz.

## Priorität 4: Drawing Tools

### Linie

Muss:
- zwei Klicks
- aktive Measurement-Box für Länge
- Achsenlock
- End-/Mittelpunkt-Snap
- Rückgängig
- Escape bricht ab
- Statushinweis

### Rechteck

Muss:
- zwei Klicks
- aktive Measurement-Box für `Breite,Tiefe`
- Achsenebenen XY/XZ/YZ
- negative Ziehrichtung korrekt
- Fläche entsteht nur bei gültigen Maßen
- Face normal korrekt

### Box/Körper

Muss:
- Ursprung + Breite/Tiefe/Höhe
- Default-Maße editierbar
- Boxkörper mit Flächen und Kanten
- als Solid-fähiges Datenmodell, nicht nur Mesh
- Material/Tag zuweisbar
- später als Component automatisch möglich

## Priorität 5: Move/Rotate/Scale

### Move

Muss:
- Objekt/Instanz verschieben
- lose Kante/Face im aktiven Kontext strecken, nicht ganze ungewollte Topologie verschieben
- präziser Abstand über Measurement Box
- Copy-Modus später
- Array-Modus später `3x`, `3/`

### Rotate

Muss:
- um aktiven Pivot/Protractor-Plane
- Objekt/Instanz rotiert als Transform
- Definition bleibt unverändert
- lose Geometrie rotiert im Kontext
- präziser Winkel
- Copy/Array später

### Scale

Noch nicht als fertig anzeigen, wenn nicht implementiert.
Wenn sichtbar:
- planned/disabled oder experimental klar markieren.
- Nicht mit Resize verwechseln.
- Für Komponenten: Instanz-Transform, Definition bleibt gleich.
- Für Möbelteile: bevorzugt dimensionsbasiertes Resize statt freiem Scale, damit Cutlist nicht kaputtgeht.

## Priorität 6: Push/Pull

MVP verbessern:
- Face Hover
- Face Selection
- Live Preview
- Measurement Box
- Undo/Redo
- Save/Load
- aktive Kontextregel

Nächste Stufe:
- alle planaren Faces
- Normalenrichtung
- Extrusion nach außen/innen
- Cut nur nach Kernel-Entscheidung

Nicht behaupten:
- beliebige solids
- booleans
- curved faces
- durchgängige Cutouts
wenn nicht getestet.

## Priorität 7: Inference/Snapping

Muss als eigener Core entstehen:
- `src/core/inference.ts`
- testbar ohne React
- Candidates:
  - endpoint
  - midpoint
  - center
  - onEdge
  - onFace
  - axisX/Y/Z
  - perpendicular
  - parallel
  - fromPoint
- UI Overlay separat:
  - eigene Marker
  - klare kleine Labels
  - Achsenhinweise

## Priorität 8: Measurement Box

Muss:
- globales Eingabeverhalten
- tool-aware parser
- `1200`, `1200mm`, `1.2m`, `1200,600`, `1200;600`, `45deg`
- Enter übernimmt
- Esc bricht ab
- keine Konflikte in Textfeldern
- Tests für Parser und Anwendung

## Priorität 9: Outliner/Tags/Materials

### Outliner
- Hierarchie anzeigen.
- Search.
- Rename.
- Select sync.
- Visibility.
- Lock.
- Active context anzeigen.

### Tags
- Sichtbarkeit pro Tag.
- Tag Folder später.
- Color by Tag.
- Active Tag nur später/Expertenmodus.

### Materials
- Farbe/Textur.
- Face/Part/Component assignment.
- Holz/MDF/Multiplex/Glas/Metall.
- Maserung/Kanten/Dicke für Cutlist.

## Priorität 10: Datei-Formate

- `.hcad.json` bleibt Hauptformat.
- Migrationen versionieren.
- DXF/STL nur exakt getestete Teilmengen dokumentieren.
- DWG/SKP nur über Bridge-Plan, keine falschen Versprechen.
- GLB/glTF für Rendering- und Austausch-Pipeline prüfen.
