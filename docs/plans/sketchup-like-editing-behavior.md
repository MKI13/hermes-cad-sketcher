# SketchUp-ähnliches Editierverhalten — Recherche und Umsetzungsplan

Datum: 2026-05-26
Host: newpc
Ziel: Hermes CAD darf nicht nur Körper schöner rendern. Das Programm braucht klare, technische SketchUp-ähnliche Regeln für lose Geometrie, Gruppen, Komponenten, Kanten, Flächen, Push/Pull und Edit-Kontexte.

## Quellen

- SketchUp Help: Selecting Geometry — https://help.sketchup.com/en/sketchup/selecting-geometry
- SketchUp Help: Grouping Geometry — https://help.sketchup.com/en/sketchup/grouping-geometry
- SketchUp Help: Creating a Basic Component — https://help.sketchup.com/en/sketchup/creating-basic-component
- SketchUp Help: Editing Components — https://help.sketchup.com/en/sketchup/editing-components
- SketchUp Help: Moving Entities Around — https://help.sketchup.com/en/sketchup/moving-entities-around
- SketchUp Help: Stretching Geometry — https://help.sketchup.com/en/sketchup/stretching-geometry
- SketchUp Help: Pushing and Pulling Shapes into 3D — https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d
- SketchUp Help: Flipping, Mirroring, Rotating and Arrays — https://help.sketchup.com/en/sketchup/flipping-mirroring-rotating-and-arrays
- SketchUp Ruby API: Model#active_entities / active_path — https://ruby.sketchup.com/Sketchup/Model.html#active_entities-instance_method

## Grundregel

Hermes CAD braucht einen aktiven Bearbeitungskontext, ähnlich SketchUp `active_entities` und `active_path`:

- Root-Kontext: lose Modellgeometrie.
- Group-Kontext: eigene Kanten, Flächen und Körper innerhalb einer Gruppe.
- Component-Definition: geteilte Geometrie mehrerer Instanzen.
- Component-Instanz: Transformation einer Instanz, aber nicht automatisch Änderung der Definition.

Nur Geometrie im aktiven Kontext darf direkt als Kante, Fläche oder Punkt bearbeitet werden.

## Punkt 1 — Auswahl von loser Geometrie

Soll-Verhalten:

- Lose Kanten, Flächen und später Vertices/Endpunkte sind direkt auswählbar.
- Klick auf eine Kante wählt die Kante.
- Klick auf eine Fläche wählt die Fläche.
- Klick auf einen Körper wählt entweder den Körper oder, wenn Face-Editing aktiv ist, die getroffene Fläche.
- Doppelklick/Treble-Click können später zusammenhängende Geometrie auswählen.

Aktueller Stand:

- `edge`, `face`, `box`, `referenceMesh` existieren als Entity-Typen.
- Box-Faces wurden im letzten Commit nur für Hover/Selection vorbereitet.
- Es gibt noch kein vollwertiges Topologie-Modell mit einzelnen Box-Kanten/Vertices.

## Punkt 2 — Gruppen/Komponenten blockieren innere Auswahl von außen

Soll-Verhalten:

- Außerhalb des Gruppen-/Komponenten-Kontexts wird nur die Gruppe oder Komponenten-Instanz als Objekt ausgewählt.
- Innere Kanten/Flächen dürfen von außen nicht bewegt, gelöscht, geteilt, extrudiert oder rotiert werden.
- Doppelklick oder explizite Aktion öffnet den Edit-Kontext.
- Klick außerhalb oder `Close Group/Component` schließt den Kontext.

Warum:

- SketchUp trennt lose Geometrie und Objects. Gruppen/Komponenten kleben nicht an umliegender Geometrie.
- Änderungen innerhalb einer Component-Definition sollen alle Instanzen ändern, sofern nicht vorher `Make Unique` ausgeführt wird.

## Punkt 3 — Kanten ziehen und lose Geometrie strecken

Soll-Verhalten:

- Wenn eine lose Kante im aktiven Kontext ausgewählt ist, darf sie entlang einer Achse oder freien Richtung verschoben werden.
- Angrenzende Flächen müssen konsistent mitgezogen/gestreckt werden.
- Verschieben einer Fläche streckt den Körper.
- Verschieben eines Endpunkts zieht angrenzende Kanten/Flächen mit.
- Für erste Implementierung kann Box-Topologie kontrolliert unterstützt werden, danach allgemeine Face/Edge-Topologie.

Wichtig:

- Das ist nicht nur `moveEntity` für ein ganzes Objekt.
- Es braucht Topologie-Regeln, damit der Körper nicht kaputt geht.

## Punkt 4 — Push/Pull / Fläche extrudieren

Soll-Verhalten:

- Push/Pull ist nur auf einer Fläche im aktiven Kontext gültig.
- Push/Pull außerhalb einer Gruppe/Komponente auf deren innere Fläche ist blockiert.
- Eine Box-Face kann mit Vorschau extrudiert werden.
- Präzise Distanz-Eingabe über Measurements Box ist Pflicht für CAD-taugliches Arbeiten.
- Extrusion erzeugt/aktualisiert Geometrie im selben Kontext.

## Punkt 5 — Rotieren

Soll-Verhalten:

- Gruppe/Komponente außerhalb Edit-Kontext: Objekt/Instanz rotieren.
- Lose Kante/Fläche im aktiven Kontext: Geometrie rotieren oder strecken, ohne Kontextgrenzen zu verletzen.
- Component-Instanz-Rotation ändert nicht die Definition und nicht andere Instanzen.
- Geometrie in gesperrten Objekten bleibt blockiert.

## Punkt 6 — Komponenten

Soll-Verhalten:

- `Make Component` erzeugt eine Definition plus mindestens eine Instanz.
- Bearbeitung der Definition wirkt auf alle Instanzen.
- `Make Unique` erlaubt Abspalten einer einzelnen Instanz.
- Instanz-Transformationen wie Move/Rotate/Scale bleiben instanzlokal.

## Punkt 7 — Tests vor UI

Für jeden Punkt zuerst reine TypeScript-Tests:

- Auswahl respektiert aktiven Kontext.
- Innere Gruppen-/Komponenten-Geometrie ist außerhalb blockiert.
- Öffnen/Schließen des Edit-Kontexts setzt `activePath` korrekt.
- Kanten-/Flächenbewegungen ändern erwartete Punkte und Dimensionen.
- Push/Pull akzeptiert nur aktive Faces.
- Komponenteninstanzen teilen Definitionen, bis `Make Unique` ausgeführt wird.

## Reihenfolge der Issues

1. Edit-Kontext und Selection-Grenzen.
2. Datenmodell für Gruppen/Komponenten/Definitionen/Instanzen.
3. Loose Face/Edge Move/Stretch für einfache Box-/Face-Topologie.
4. Push/Pull mit aktivem Kontext und genauer Eingabe.
5. Rotate/Transform-Regeln für lose Geometrie und Instanzen.
6. UI-Integration: Doppelklick Edit Context, Breadcrumb, Close Group/Component, Hinweise.

## Stop-Regeln

- Nicht einfach ein optisches Highlight als fertige Funktion melden.
- Nicht innere Component-Geometrie von außen editierbar machen.
- Nicht `main` direkt pushen.
- Vor Implementierung Issue claimen, Tests schreiben, dann Code ändern.
- Nach jedem Slice `npm run check` auf newpc ausführen.
