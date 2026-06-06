# Hermes CAD Dynamic Components & Cabinet/Korpus Spec

Ziel: Hermes CAD soll parametrische Komponenten für Schreiner bauen, besonders Schränke, Küchen, Kleiderschränke und Korpusse.

## Dynamic Component Modell

### DynamicComponentDefinition

Erweitert ComponentDefinition um:

- attributes
- formulas
- options
- constraints
- actions
- childBindings
- validationRules
- parameterUI
- recomputeGraph
- version

### DynamicAttribute

Felder:

- key
- label
- type: number | length | angle | boolean | enum | material | text | formula
- value
- defaultValue
- min
- max
- step
- unit
- visibleInOptions
- editableByUser
- formula
- dependsOn
- description
- group
- order

### Predefined Attributes

Hermes soll diese SketchUp-artigen Attribute unterstützen, aber mit eigenem internen Namespace:

- X
- Y
- Z
- LenX
- LenY
- LenZ
- RotX
- RotY
- RotZ
- Hidden
- Copies
- Copy
- Material
- Name
- Summary
- Description
- OnClick / Action später

Interner Namespace-Vorschlag:

- `h.x`
- `h.y`
- `h.z`
- `h.len_x`
- `h.len_y`
- `h.len_z`
- `h.rot_x`
- `h.rot_y`
- `h.rot_z`
- `h.hidden`
- `h.copies`
- `h.copy`
- `h.material`

Die UI darf bekannte Begriffe wie Breite, Höhe, Tiefe, Rotation, Sichtbarkeit verwenden.

## Formula Engine

Muss können:

- + - * / ^
- Klammern
- IF
- AND/OR/NOT
- ROUND
- FLOOR/CEIL
- MIN/MAX
- ABS
- CONCAT
- CHOOSE
- LOOKUP optional
- Einheitserkennung
- Abhängigkeiten erkennen
- Zyklusfehler erkennen
- Fehler freundlich anzeigen

Beispiel:

```text
inner_width = width - 2 * side_thickness
shelf_width = inner_width
door_width = (width - gap) / 2
shelf_count = FLOOR((height - 200mm) / 320mm)
```

## Cabinet/Korpus Generator

### Hauptparameter

- width
- height
- depth
- side_thickness
- top_bottom_thickness
- back_thickness
- back_inset
- plinth_height
- toe_kick_depth
- material
- back_material
- edge_band_thickness
- reveal_gap
- construction_type

### Bauteile

- left_side
- right_side
- top
- bottom
- back_panel
- shelves
- fixed_shelves
- doors
- drawer_boxes
- drawer_fronts
- plinth
- feet
- hinges
- handles
- rails
- clothes_rod
- drill_holes
- connectors
- edge_bands

### Schranktypen

1. Base Cabinet / Unterschrank
2. Wall Cabinet / Hängeschrank
3. Tall Cabinet / Hochschrank
4. Wardrobe / Kleiderschrank
5. Open Shelf Cabinet / Regal
6. Drawer Cabinet / Schubladenschrank
7. Sink Cabinet / Spülenschrank
8. Corner Cabinet / Eckschrank später
9. Sliding Door Wardrobe später

## Parameter UI

Panel: `Dynamic Options`

Gruppen:

- Maße
- Konstruktion
- Türen
- Schubladen
- Einlegeböden
- Rückwand
- Sockel/Füße
- Material
- Kanten
- Beschläge
- Zuschnitt/BOM

Jede Änderung:

1. Validieren.
2. Preview aktualisieren.
3. Ein Undo-Schritt, wenn Nutzer Änderung bestätigt.
4. Bei Live-Preview: temporärer Zustand, commit erst bei Enter/Apply.

## Beispiel: Einfacher Korpus

Parameter:

```yaml
width: 600mm
height: 720mm
depth: 560mm
side_thickness: 19mm
back_thickness: 8mm
shelf_count: 1
door_count: 2
gap: 2mm
```

Formeln:

```text
inner_width = width - 2 * side_thickness
inner_height = height - top_bottom_thickness * 2
side_height = height
side_depth = depth
top_width = inner_width
bottom_width = inner_width
back_width = width
back_height = height
door_width = (width - gap) / door_count
door_height = height
shelf_width = inner_width
shelf_depth = depth - back_thickness - 20mm
```

## Constraints

Wichtig: Beim Skalieren dürfen bestimmte Teile nicht falsch verzerrt werden.

Beispiele:

- Materialstärke bleibt 19 mm.
- Türspalt bleibt 2 mm.
- Lochreihen behalten Lochabstand.
- Griffe behalten Größe.
- Topfbänder behalten Durchmesser/Position.
- Schubladenschienen behalten Breite/Höhe.
- Kantenband bleibt Materialeigenschaft, keine Geometrie-Verzerrung.

## Interactions

Optional später:

- Tür öffnen/schließen.
- Schublade ausziehen.
- Griffposition ändern.
- Material per Dropdown wechseln.
- Anzahl Böden ändern.
- Lochreihe anzeigen/verbergen.

## Cutlist/BOM Vorbereitung

Jedes Bauteil muss Metadaten tragen:

- part_id
- part_name
- material
- length
- width
- thickness
- quantity
- grain_direction
- edge_front
- edge_back
- edge_left
- edge_right
- drilling_pattern
- hardware
- notes

Später kann daraus eine Zuschnittliste entstehen.

## Abnahmetests für Korpus

Ein Feature ist nur fertig, wenn:

- Breite/Höhe/Tiefe geändert werden können.
- Materialstärke bleibt konstant.
- Rückwand korrekt berechnet wird.
- Einlegeböden korrekt verteilt werden.
- Türanzahl 0/1/2 funktioniert.
- Schubladenanzahl 0–8 funktioniert.
- Zuschnitt-Metadaten korrekt sind.
- ComponentInstance bleibt instanzierbar.
- Make Unique funktioniert.
- Undo/Redo funktioniert.
- Outliner zeigt alle Unterteile sauber.
