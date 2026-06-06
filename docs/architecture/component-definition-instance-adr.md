# ADR: ComponentDefinition und ComponentInstance im Hermes-CAD-MVP

Datum: 2026-06-06
Status: angenommen für lokale Upgrade-Pack-Version

## Kontext

Das Upgrade-Pack fordert SketchUp-ähnliche Komponentenlogik: wiederverwendbare Definitionen, mehrere Instanzen, Bearbeiten im Kontext, `Make Unique`, `Explode` und Outliner-Synchronisierung. Der bestehende MVP-Kern hatte Komponenten bisher als Container mit `entityIds` modelliert.

## Entscheidung

Hermes CAD führt `ComponentDefinition` als eigenes Kernobjekt ein. Bestehende `Component`-Objekte bleiben als Instanz-/Container-Repräsentation erhalten und bekommen eine stabile `definitionId`.

- `createComponent` erzeugt eine neue Definition, wenn keine `definitionId` übergeben wird.
- `duplicateComponent` koppelt wiederverwendbare Komponenten an dieselbe Definition.
- Gruppen bleiben organisatorische Einzelcontainer und bekommen bei Kopie eine eigene Definition.
- `makeComponentUnique` erzeugt eine neue Definition für eine ausgewählte Instanz.
- `explodeComponent` entfernt den Container und macht dessen Entitäten wieder lose editierbar.
- Mutationen im offenen Komponentenkontext synchronisieren einfache Geometrieänderungen zu Instanzen derselben Definition.

## Warum so

Der bestehende MVP arbeitet noch mit echten Entitäten pro Instanz, nicht mit einem vollständigen Transform-/Definition-Graph. Diese Entscheidung ermöglicht sofort testbares, nutzbares Komponentenverhalten, ohne den gesamten Kernel zu ersetzen.

## Folgen

Positiv:

- Bestehende Projektdateien bleiben importierbar; fehlende Definitionen werden aus Komponenten abgeleitet.
- Neue Projektdateien speichern `componentDefinitions` zusätzlich zu `components`.
- `Make Unique` und `Explode` sind als Kernfunktionen testbar.

Grenzen:

- Mehrstufig verschachtelte Komponenten und bibliotheksbasierte Reload/Replace-Abläufe brauchen einen späteren Transform-Graph.
- Diese Version synchronisiert Basisgeometrie über parallele Entity-Indizes. Für komplexe verschachtelte Definitionen ist ein eigener Definition-Scenegraph nötig.
