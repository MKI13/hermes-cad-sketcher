# Audit: aktueller Hermes-CAD-Stand nach SketchUp-Upgrade-Pack

Datum: 2026-06-06
Branch: `local/sketchup-upgrade-pack-*` auf `newpc`

## Bereits vorhanden

- React/Vite CAD-Oberfläche mit linkem Icon-Rail, Top-Menü, rechtem Tray und Statusleiste.
- Modellkern für Linien, Rechtecke, Boxkörper, Push/Pull, Move, Rotate, Material, Tags und Projektdateien.
- Komponentenkontext: geschlossene Komponenten schützen Innengeometrie; Doppelklick öffnet, leerer Viewport-Klick schließt.
- Dynamische Schrank-/Korpus-Engine mit Parametern, Teilen, Cutlist, EdgeList, Bohrungen, Hardware und Exportvorbereitung.
- Eigene Hermes-Icons unter eigener Asset-Struktur; keine SketchUp-Icons.
- Versionssichere lokale Arbeit: Rollback-Tag und Backup-Verzeichnis wurden vor diesem Paket erstellt.

## Neu mit diesem Paket integriert

- Das komplette ZIP-Paket liegt versioniert unter `docs/reference-packs/hermes-cad-sketchup-upgrade-pack/`.
- Recherche-Datei für Komponenten/Definitionen/Instanzen angelegt.
- `ComponentDefinition` als eigenes Modellobjekt ergänzt.
- `ComponentInstance`-ähnliches Verhalten: Komponenten tragen `definitionId`; Instanzanzahl ist abrufbar.
- Kopierte wiederverwendbare Komponenten teilen die Definition.
- Bearbeitung im offenen Komponentenkontext synchronisiert Basisgeometrie zu anderen Instanzen derselben Definition.
- `Make Unique` trennt eine Instanz in eine eigene Definition.
- `Explode` gibt die Geometrie aus einem Container frei und räumt ungenutzte Definitionen auf.
- Komponenten-Tray zeigt Definitionen, Instanzanzahl und die neuen Aktionen.

## Gaps aus dem Upgrade-Pack

- Verschachtelte Komponentenpfade sind im Datenmodell erst als ein aktiver Component-Context vorhanden.
- Outliner ist noch kein vollwertiger Baum mit Suche, Drag-and-drop, Lock/Hide und Virtualisierung.
- Replace/Reload/Save-As-Komponentenbibliothek ist im Kern vorbereitet, aber UI und Datei-/Bibliotheksformat fehlen noch.
- Dynamic-Component-Formeleditor und allgemeines Attributsystem sind noch nicht vollständig UI-fertig.
- 10.000-Node-Outliner-Performance und große Instanzmengen brauchen eigene Performance-Tests.

## Sicherheits-/Rollback-Status

- Vor der Integration wurde auf `newpc` ein lokaler Sicherheits-Checkpoint-Commit erstellt.
- Rollback erfolgt über den Tag `rollback/pre-sketchup-upgrade-pack-*` oder das Backup-Verzeichnis unter `~/hermes-cad-sketcher-backups/`.
- Es wurde nicht auf `main` gepusht und nichts gemergt.
