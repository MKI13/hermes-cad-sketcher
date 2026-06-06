# Hermes CAD Implementation Roadmap

## Phase 0 – Audit

Ziel: Verstehen, was Hermes CAD aktuell schon kann.

Tasks:

- Codebase scannen.
- Bestehendes Datenmodell dokumentieren.
- Existing UI Panels dokumentieren.
- Selection/Undo/Entities prüfen.
- Liste der Lücken erstellen.
- `docs/audit/current_cad_state.md` anlegen.

Output:

- Architecture map.
- Gap analysis.
- Risiken.

## Phase 1 – Entity & Selection Foundation

Ziel: Stabile Grundlage.

Tasks:

- Entity IDs.
- Selection Model.
- Transform System.
- Bounding Boxes.
- Lock/Hidden States.
- Tags/Layers.
- Undo Operations.
- Event Bus für UI-Sync.

Abnahme:

- Auswahl im Viewport und Panels synchron.
- Undo/Redo zuverlässig.

## Phase 2 – Groups

Tasks:

- Create Group.
- Edit Group.
- Explode Group.
- Rename Group.
- Lock/Hide Group.
- Outliner Eintrag.
- Entity Info.

Abnahme:

- Gruppen schützen Geometrie.
- Verschachtelung funktioniert.
- Undo/Redo funktioniert.

## Phase 3 – Basic Components

Tasks:

- ComponentDefinition.
- ComponentInstance.
- Create Component Dialog.
- Edit in Context.
- Make Unique.
- Explode.
- Replace.
- Save As.
- Reload.
- Purge Unused.

Abnahme:

- Eine Änderung an Definition aktualisiert alle Instanzen.
- Make Unique trennt einzelne Instanz.
- Speichern/Laden funktioniert.

## Phase 4 – Outliner

Tasks:

- Tree Model.
- Search.
- Rename.
- Drag & Drop.
- Visibility.
- Lock.
- Selection Sync.
- Context Menu.
- Virtualization for large models.

Abnahme:

- 10.000 Nodes bedienbar.
- Auswahl synchronisiert zuverlässig.

## Phase 5 – Component Browser / Library

Tasks:

- In Model Components.
- Local Library.
- Thumbnail Generation.
- Insert Tool.
- Replace Selected.
- Favorites.
- Recent.
- Import/Export `.hcomp`.

Abnahme:

- Komponenten schnell wiederverwendbar.
- Bibliothek bleibt performant.

## Phase 6 – Measurement & Tool UX

Tasks:

- Measurement Box.
- Status Bar.
- Inference Lock.
- Pre-selection.
- Esc reset.
- Active Tool Highlight.
- Shortcut mapping.

Abnahme:

- Modellieren fühlt sich präzise und schnell an.

## Phase 7 – Dynamic Attributes

Tasks:

- DynamicAttribute Model.
- Attribute Editor.
- Options Panel.
- Formula Engine.
- Dependency Graph.
- Recompute.
- Validation.
- UI Controls.

Abnahme:

- Parameter ändern Geometrie korrekt.
- Formel-Fehler werden freundlich angezeigt.

## Phase 8 – Cabinet/Korpus Generator

Tasks:

- Cabinet schema.
- Korpus base.
- Doors.
- Drawers.
- Shelves.
- Back panel.
- Plinth/feet.
- Hardware metadata.
- Edge banding.
- Material metadata.
- BOM/cutlist metadata.

Abnahme:

- Mindestens 5 reale Schranktypen funktionieren.

## Phase 9 – Polish & Documentation

Tasks:

- Eigene Icons.
- Nutzerhilfe.
- Tooltips.
- Templates.
- Example Library.
- Regression tests.
- Performance tests.
- Installer/update flow.

Abnahme:

- Schreiner kann ohne Entwicklerhilfe einen parametrischen Schrank erstellen, ändern und wiederverwenden.
