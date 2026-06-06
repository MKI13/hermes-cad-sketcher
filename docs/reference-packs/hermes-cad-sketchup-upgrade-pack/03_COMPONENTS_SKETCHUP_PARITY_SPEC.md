# Hermes CAD Components – SketchUp-Parity Spezifikation

Diese Spezifikation beschreibt, wie Hermes CAD das Komponenten-System aufbauen soll.

## Grundbegriffe

### Entity

Basiselement im Modell:

- Edge
- Face
- Curve
- Solid
- Mesh
- Group
- ComponentInstance
- Annotation
- Section/Construction Geometry

### Group

Eine Gruppe ist ein Container, um Geometrie zusammenzufassen und vor versehentlicher Bearbeitung zu schützen.

Eigenschaften:

- Name
- UUID
- Transform
- Children
- Locked
- Hidden
- Material optional
- Tags/Layers
- Metadata

Gruppen sind nicht primär wiederverwendbar. Wenn Nutzer gleiche Objekte mehrfach brauchen, sollen sie Komponenten verwenden.

### ComponentDefinition

Die Definition beschreibt Inhalt und Verhalten einer Komponente.

Eigenschaften:

- definitionId
- name
- description
- category
- tags
- localAxes
- insertionPoint
- bounds
- childEntities
- dynamicAttributes
- thumbnails
- libraryPath
- version
- author
- createdAt
- updatedAt

### ComponentInstance

Eine Instanz verweist auf eine ComponentDefinition.

Eigenschaften:

- instanceId
- definitionId
- transform
- instanceName optional
- materialOverride optional
- visibility
- lockState
- dynamicAttributeOverrides
- metadata

Mehrere Instanzen können auf dieselbe Definition zeigen. Änderungen an der Definition wirken auf alle Instanzen.

## Kernverhalten

### Create Component

Workflow:

1. Nutzer wählt Geometrie/Gruppen/Komponenten.
2. Befehl: Create Component.
3. Dialog öffnet:
   - Name
   - Beschreibung
   - Kategorie
   - Achsen/Origin
   - Insertion Point
   - Replace selection with component
   - Add to library optional
4. Hermes erzeugt ComponentDefinition.
5. Auswahl wird durch ComponentInstance ersetzt.
6. Undo = ein Schritt.
7. Outliner aktualisiert.
8. Entity Info zeigt neue Komponente.

Akzeptanz:

- Keine Auswahl → freundlicher Hinweis.
- Ungültige Auswahl → Hinweis.
- Komponente darf verschachtelte Gruppen/Komponenten enthalten.
- Lokale Achsen müssen sichtbar und editierbar sein.
- Name muss später änderbar sein.

### Edit Component in Context

Workflow:

1. Doppelklick auf Instanz oder Rechtsklick → Edit Component.
2. Hermes öffnet Bearbeitungsmodus.
3. Andere Modellteile werden optional ausgegraut/transparent.
4. Breadcrumb zeigt Pfad:
   `Model > Kitchen > Base Cabinet > Drawer Front`
5. Änderungen betreffen Definition.
6. Alle Instanzen aktualisieren live.
7. Exit per Esc, Klick außerhalb, Breadcrumb oder Kontextmenü.

Akzeptanz:

- Verschachteltes Editieren funktioniert.
- Aktueller Bearbeitungskontext ist visuell klar.
- Undo innerhalb Component Edit funktioniert.
- User kann nicht versehentlich außerhalb editieren, wenn Kontext gesperrt ist.

### Make Unique

Workflow:

1. Nutzer wählt eine oder mehrere Instanzen.
2. Rechtsklick/Menu: Make Unique.
3. Hermes dupliziert Definition.
4. Gewählte Instanzen zeigen auf neue Definition.
5. Name bekommt Suffix z. B. `Cabinet#2` oder `Cabinet Unique`.
6. Undo = ein Schritt.

Akzeptanz:

- Nur ausgewählte Instanzen werden abgekoppelt.
- Andere Instanzen bleiben bei alter Definition.
- Dynamic Attributes werden kopiert.
- Bibliotheksreferenz bleibt nachvollziehbar.

### Replace Component

Workflow:

1. Instanz auswählen.
2. Befehl: Replace Component.
3. Neue Definition aus Bibliothek wählen.
4. Optionen:
   - Nur Auswahl ersetzen.
   - Alle Instanzen derselben Definition ersetzen.
   - Transform beibehalten.
   - Material Overrides übernehmen.
5. Undo = ein Schritt.

### Reload Definition

Workflow:

1. Definition aus Bibliothek/Datei neu laden.
2. Alle Instanzen aktualisieren.
3. Bei Konflikten Warnung mit Vorschau.
4. Undo möglich.

### Save As Component

Workflow:

1. Instanz/Definition auswählen.
2. Save As.
3. Speichern als Hermes-Komponenten-Datei, z. B. `.hcomp`.
4. Thumbnail generieren.
5. Metadata speichern.
6. In Bibliothek sichtbar machen.

### Explode

Workflow:

1. Gruppe oder Komponente auswählen.
2. Explode.
3. Container entfernen, Child Entities in Parent-Kontext übertragen.
4. Welttransform korrekt anwenden.
5. Materialien/Tags bewahren.
6. Undo = ein Schritt.

## Outliner-Integration

Jede Group und ComponentInstance erscheint im Outliner.

Spalten/Infos:

- Icon eigenständig
- Name
- Typ
- Sichtbarkeit
- Lock
- Tags/Layers optional
- Dynamic/Parametric Marker
- Anzahl Instanzen optional

Funktionen:

- Search
- Expand/Collapse
- Rename
- Drag & Drop
- Select
- Hide/Show
- Lock/Unlock
- Isolate
- Focus camera
- Context menu

## Entity Info Panel

Wenn eine Komponente ausgewählt ist, zeigt Entity Info:

- Instance Name
- Definition Name
- Type
- Definition ID
- Instance count
- Dimensions
- Transform
- Material
- Tags/Layers
- Locked/Hidden
- Dynamic Parameters Button
- Make Unique Button
- Edit Definition Button

## Component Browser / Library

Panel:

- In Model
- Local Library
- Favorites
- Recent
- Project Library
- Online Library optional später

Funktionen:

- Search
- Tags
- Categories
- Thumbnails
- Drag into model
- Insert at cursor
- Replace selected
- Save selected as component
- Reload
- Purge unused
- Import/Export

## Tastatur und Maus

- Doppelklick = bearbeiten.
- Rechtsklick = Kontextmenü.
- Esc = Tool/Context reset.
- Delete = löschen.
- Ctrl/Cmd + Move = Kopie.
- Shift/Arrow = Inferenz/Constraint nach Hermes-Definition.
- Messfeld nimmt Werte auf, wenn Transform/Scale/Move aktiv.

## Tests

Unit Tests:

- Definition/Instance Beziehung.
- Make Unique.
- Explode.
- Replace.
- Reload.
- Nested transforms.
- Undo/Redo.

Integration Tests:

- Komponente erstellen, kopieren, editieren, prüfen ob alle Instanzen aktualisiert.
- Instanz unique machen, editieren, prüfen ob andere unverändert.
- Outliner rename synchronisiert Entity Info.
- Component Browser insert erzeugt korrekte Instanz.

Performance Tests:

- 1.000 Instanzen derselben Definition.
- 10.000 Outliner Nodes.
- Verschachtelung Tiefe 10.
- Dynamic recompute nur bei relevanten Änderungen.
