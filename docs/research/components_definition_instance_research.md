# Recherche: Komponenten, Definitionen, Instanzen und Outliner

Datum: 2026-06-06
Feature: `component-definition-instance-system`

## Quellen geprüft

- SketchUp Help Center – Components: https://help.sketchup.com/en/sketchup/components — HTTP 200 geprüft.
- SketchUp Help Center – Making a Dynamic Component: https://help.sketchup.com/en/sketchup/making-dynamic-component — HTTP 200 geprüft.
- SketchUp Help Center – Dynamic Component Predefined Attributes: https://help.sketchup.com/en/sketchup/dynamic-component-predefined-attributes — HTTP 200 geprüft.
- SketchUp Help Center – Hierarchies in the Outliner: https://help.sketchup.com/en/sketchup/working-hierarchies-outliner — HTTP 200 geprüft.
- SketchUp Extension UX Guidelines: https://sketchup.github.io/sketchup-extension-ux-guidelines/ — HTTP 200 geprüft.
- GitHub: Chili3D browser CAD reference: https://github.com/xiangechen/chili3d — HTTP 200 geprüft.
- GitHub: OpenBuilds CAM reference: https://github.com/OpenBuilds/OpenBuilds-CAM — HTTP 200 geprüft.

## Verhalten, das Hermes CAD funktional nachbildet

- Eine Komponente besteht aus einer Definition und einer oder mehreren Instanzen.
- Kopierte wiederverwendbare Komponenten bleiben an dieselbe Definition gekoppelt.
- Bearbeitung im Komponentenkontext ändert die Definition und aktualisiert gekoppelte Instanzen.
- `Make Unique` trennt nur die ausgewählte Instanz von der gemeinsamen Definition.
- `Explode` löst den Container auf und gibt die innere Geometrie wieder im Elternkontext frei.
- Der Outliner muss Definition, Instanzanzahl und Bearbeitungskontext sichtbar machen.

## Nutzererwartungen aus den Referenzen

- Doppelklick öffnet die Bearbeitung im Kontext.
- Leerer Klick, Escape oder ein Schließen-Befehl verlässt den Kontext.
- Andere Modellteile dürfen nicht versehentlich verändert werden, solange eine Komponente geschlossen ist.
- Wiederholteile, zum Beispiel Seitenwände oder Fronten, müssen bei Definition-Änderungen synchron bleiben.
- Einzelteile mit Sondermaß brauchen einen schnellen `Make Unique` Weg.

## Nicht kopieren

- Keine SketchUp-Icons, Logos, Screenshots, Markenfarben oder Hilfetexte als Asset.
- Keine proprietären SketchUp-Ruby-APIs als angebliche Kompatibilität.
- Begriffe wie `Make Unique`, `Explode`, `Component`, `Outliner` sind beschreibende CAD-Workflow-Begriffe; die visuelle Gestaltung bleibt Hermes-eigen.

## Hermes-CAD-Umsetzungsplan dieser Version

1. Internes `ComponentDefinition` Modell ergänzen.
2. Komponenteninstanzen mit `definitionId` speichern.
3. Duplizieren wiederverwendbarer Komponenten an dieselbe Definition koppeln.
4. Bearbeitung im aktiven Komponentenkontext für Basisgeometrie an gekoppelte Instanzen synchronisieren.
5. `makeComponentUnique` und `explodeComponent` im Modell implementieren.
6. UI im Komponenten-Tray um Definitionen, Instanzanzahl, `Make Unique` und `Explode` ergänzen.
7. Referenzpaket aus dem ZIP unter `docs/reference-packs/hermes-cad-sketchup-upgrade-pack/` versioniert ablegen.

## Noch offen für spätere Schritte

- Verschachtelte Definitionspfade mit mehrstufigem Breadcrumb.
- Replace/Reload/Save-As-Komponentenbibliothek als vollständige UI.
- Outliner Drag-and-drop, Lock/Hide pro ComponentInstance und Performance-Test mit 10.000 Nodes.
- Vollständige parametrische Dynamic-Component-Attribute mit Formeleditor über die schon vorhandene Schrank-Engine hinaus.
