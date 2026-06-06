# SketchUp-Verhaltensbaseline für Hermes CAD

Diese Datei definiert, was Hermes Agent als Verhalten-Vergleich benutzen soll. Hermes soll nicht SketchUp kopieren, aber die wichtigsten Bedienprinzipien unabhängig nachbauen.

## Komponenten

SketchUp-Prinzip:
- Eine Komponente hat Definition und Instanz.
- Die Definition beschreibt Geometrie/Verhalten.
- Jede platzierte Kopie ist eine Instanz.
- Bearbeitung der Definition betrifft alle Instanzen.
- Transformieren einer Instanz ändert nicht die Definition.
- Make Unique trennt eine Instanz von der gemeinsamen Definition.

Hermes-Ziel:
- `ComponentDefinition` enthält lokale Geometrie.
- `ComponentInstance` enthält `definitionId`, Transform, Name, Tags, Material Override.
- `Make Unique` dupliziert Definition und bindet nur ausgewählte Instanzen um.
- Explode macht aus Gruppe/Komponente wieder lose Geometrie im aktiven Kontext.
- Für Möbelbau ist jedes echte Brett/Teil eine eigene Komponente/Instanz.

## Gruppen

SketchUp-Prinzip:
- Gruppen kapseln Geometrie.
- Gruppen kleben nicht an anderer Geometrie.
- Doppelklick öffnet den Bearbeitungskontext.
- Außerhalb des Kontexts wird die Gruppe als Objekt ausgewählt.
- Innere Geometrie wird von außen nicht direkt verändert.

Hermes-Ziel:
- Root-Kontext + verschachtelte Edit-Kontexte.
- Aktiver Kontext ist immer sichtbar.
- Doppelklick öffnet Gruppe/Komponente.
- `Close Group/Component` oder Klick ins Leere verlässt Kontext.
- Breadcrumb zeigt aktiven Pfad.

## Auswahl

Hermes muss unterscheiden:

- Lose Geometrie im aktiven Kontext:
  - einzelne Kante/Fläche auswählbar
  - Move kann angrenzende Geometrie strecken
- Gruppe/Komponente außerhalb:
  - nur Objekt/Instanz auswählbar
  - innere Geometrie geschützt
- Referenzmesh:
  - auswählbar/inspektierbar, aber nicht editierbarer Solid

## Push/Pull

SketchUp-Prinzip:
- Push/Pull funktioniert auf Faces.
- Tool klickt Fläche, Fläche wird hervorgehoben, Maus bewegt Extrusion.
- Measurement Box zeigt Tiefe.
- Nach Klick kann präziser Wert eingegeben werden.
- Push/Pull kann Volumen hinzufügen oder wegnehmen.
- Wiederholung/Double-click ist später möglich.

Hermes-Ziel in Phasen:
1. Planare Rechteck-Faces sauber.
2. Beliebige planare Polygon-Faces.
3. Cut-through nur nach Geometrie-Kernel-Entscheidung.
4. Wiederholfunktion speichern (`lastPushPullDistance`).
5. Measurement Box direkt integrieren.

## Measurement Box

SketchUp-Prinzip:
- Unten rechts.
- Bedeutung hängt vom aktiven Werkzeug ab.
- Man kann nach Werkzeugaktion tippen, ohne vorher ins Feld zu klicken.
- Werte setzen Länge, Größe, Distanz, Winkel, Skalierung oder Array.

Hermes-Ziel:
- Globaler keyboard input router.
- Kein Konflikt mit Textfeldern.
- `Esc` bricht aktuelle Eingabe/Werkzeugvorschau ab.
- `Enter` übernimmt.
- Dezimalkomma und Punkt akzeptieren.
- Millimeter bleibt intern.
- Spätere Unit-Konvertierung nur sichtbar und getestet.

## Inference/Snapping

SketchUp-Prinzip:
- Snap- und Inferenzhinweise führen die Konstruktion.
- Endpunkt, Mittelpunkt, Kante, Fläche, Achse, parallel/perpendicular.
- Achsenfarben müssen sofort verständlich sein.

Hermes-Ziel:
- Inferenz als reine testbare Core-Logik.
- UI zeigt kleine eigene Marker, Labels und Achsenfarben.
- Achsenlock mit Pfeiltasten oder klar dokumentierten Shortcuts.
- Keine SketchUp-Farben/Icons kopieren, aber Achsenlogik darf vertraut sein: Rot/Grün/Blau.

## Outliner

SketchUp-Prinzip:
- Hierarchischer Baum für Gruppen/Komponenten.
- Auswählen im Outliner wählt im Modell.
- Umbenennen.
- Suchen/Filtern.
- Sichtbarkeit steuern.
- Hierarchie organisieren.

Hermes-Ziel:
- Root > Gruppen > Komponenten > Subkomponenten.
- Sichtbarkeit pro Objekt.
- Aktiver Kontext sichtbar.
- Rename sicher.
- Drag/drop Umstrukturierung erst nach Tests.
- Keine Icons aus SketchUp verwenden.

## Tags

SketchUp-Prinzip:
- Tags organisieren Objekte und Sichtbarkeit.
- Tags ersetzen keine Gruppen/Komponenten.
- Tag-Panels haben Filter, Sichtbarkeit und Farblogik.

Hermes-Ziel:
- Tags primär auf Gruppen/Komponenten/Objekten, nicht lose Geometrie als Standard.
- Sichtbarkeit pro Tag.
- Color-by-tag als eigener Anzeige-Modus.
- Active Tag nur als Expertenfunktion, nicht als Standard.

## Materialien

SketchUp-Prinzip:
- Material kann Objekten/Faces zugewiesen werden.
- Materialien haben Farben/Texturen und Fläche.
- Im Möbelbau braucht Hermes zusätzlich Materialdaten, Kanten, Maserung, Dicke.

Hermes-Ziel:
- Farbe, Name, Textur, Transparenz
- später PBR-Felder für Rendering
- woodworking metadata:
  - materialType
  - thicknessMm
  - grainDirection
  - edgeBanding
  - boardSku
  - cutListRole

## Kamera

SketchUp-ähnlich:
- Orbit
- Pan
- Zoom
- Zoom Extents
- Standardansichten
- Scenes später

Hermes-Ziel:
- Maussteuerung stabil.
- Keine Werkzeug-Icons am Cursor dauerhaft.
- klare Statusleiste.
- Viewport bleibt groß.
