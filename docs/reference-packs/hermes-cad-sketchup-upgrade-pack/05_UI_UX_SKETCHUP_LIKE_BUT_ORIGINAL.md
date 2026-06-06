# Hermes CAD UI/UX – SketchUp-artig, aber eigenständig

Ziel: Hermes CAD soll schnell und intuitiv sein. Nutzer sollen sich wie in einem einfachen, direkten 3D-Modeller fühlen, aber Hermes CAD muss eine eigene Oberfläche haben.

## Hauptbereiche

### 1. 3D Viewport

- Freier Orbit, Pan, Zoom.
- Snap-Punkte: Endpoint, Midpoint, Center, Face, Edge, Axis.
- Farbliche Achsen-Hinweise.
- Temporäre Hilfslinien.
- Auswahl-Highlight.
- Bounding Boxes für Gruppen/Komponenten.
- 3D Handles für Move/Rotate/Scale.
- Edit-in-Context Darstellung.

### 2. Toolbar

Eigene Hermes Icons für:

- Select
- Line
- Rectangle
- Push/Pull oder Extrude
- Move
- Rotate
- Scale
- Tape/Measure
- Orbit
- Pan
- Zoom
- Create Group
- Create Component
- Edit Component
- Make Unique
- Dynamic Options
- Outliner
- Components Browser

Regel: Wenige Icons sichtbar, Erweiterungen in Menüs/Subtoolbars.

### 3. Rechte Panels

Standard-Panels:

- Entity Info
- Components
- Outliner
- Materials
- Tags/Layers
- Scenes/Views optional
- Dynamic Options
- Component Attributes
- Cutlist/BOM später

Panels müssen:

- andockbar sein.
- einklappbar sein.
- Suche unterstützen, wo sinnvoll.
- Auswahl synchronisieren.

### 4. Statusleiste

Zeigt immer:

- Aktives Werkzeug.
- Nächster Schritt.
- Modifier Keys.
- Kurze Hilfe.

Beispiele:

- `Select: Wähle eine Gruppe oder Komponente. Shift = zur Auswahl hinzufügen.`
- `Move: Klicke Startpunkt. Pfeiltasten = Achse sperren.`
- `Create Component: Wähle Geometrie und bestätige den Namen.`

### 5. Messfeld

Das Messfeld ist Pflicht für präzise Eingabe.

Beispiele:

- Beim Linie-Zeichnen: Länge eingeben.
- Beim Move: Abstand eingeben.
- Beim Rectangle: `600,400` eingeben.
- Beim Scale: Faktor oder Zielmaß eingeben.
- Beim Dynamic Cabinet: Maße über Panel eingeben.

Das Messfeld muss Modell-Einheiten verstehen:

- mm
- cm
- m
- inch optional
- ohne Einheit = Modellstandard

### 6. Kontextmenü

Rechtsklick auf Komponente:

- Edit Component
- Make Unique
- Dynamic Options
- Entity Info
- Replace Component
- Save As Component
- Reload Definition
- Explode
- Hide
- Lock
- Focus in Outliner

Rechtsklick auf Gruppe:

- Edit Group
- Make Component
- Explode
- Hide
- Lock
- Rename

Rechtsklick auf leeren Bereich:

- Exit Edit Context
- Paste
- View Tools
- Model Info

## Werkzeugverhalten

### Esc

- Setzt aktuellen Werkzeugschritt zurück.
- Verlässt nicht zwingend das Werkzeug, sondern startet es neu.
- In verschachteltem Component Edit kann Esc zuerst aktuelle Aktion abbrechen, danach Kontext verlassen, wenn keine Aktion aktiv ist.

### Pre-Selection

Wenn Nutzer schon etwas ausgewählt hat und Befehl startet:

- Create Component nutzt die Auswahl.
- Move nutzt die Auswahl.
- Rotate nutzt die Auswahl.
- Scale nutzt die Auswahl.
- Make Unique nutzt die Auswahl.

Wenn nichts ausgewählt ist:

- Werkzeug geht in Auswahlmodus, statt Fehlermeldung zu schreien.

### Inference Lock

- Pfeiltasten oder definierte Shortcuts sperren Achse.
- Shift kann aktuelle Inferenz sperren.
- Statusleiste zeigt Lock-Zustand.
- Visuelle Achsenführung muss klar sein.

## UI Texte

Regeln:

- Kurz.
- Freundlich.
- Nicht technisch unnötig kompliziert.
- Deutsch und Englisch vorbereiten.
- Keine fremden Hilfetexte kopieren.

Beispiele:

Schlecht:
`Operation failed: invalid entity state`

Gut:
`Diese Auswahl kann nicht verschoben werden, weil ein Objekt gesperrt ist.`

## Eigene Hermes-CAD UI-Identität

Hermes darf sich am Workflow orientieren, aber soll eigenständig aussehen:

- eigene Icons
- eigene Panelgestaltung
- eigene Farben
- eigene Namen für Spezialfunktionen
- eigene Hilfe/Instructor-Texte
- eigenes Logo
- eigene Design-Sprache

Vorschlag Produktbegriffe:

- `Hermes Component`
- `Hermes Dynamic Component`
- `Korpus Generator`
- `Bauteil-Info`
- `Strukturbaum`
- `Parameter`
- `Bauteilbibliothek`

## Performance UX

- Outliner mit vielen Objekten muss virtualisiert sein.
- Suche darf nicht blockieren.
- Dynamic updates mit Debounce.
- Große Komponenten-Bibliotheken lazy laden.
- Thumbnails cachen.
- Fortschritt anzeigen bei langen Operationen.
