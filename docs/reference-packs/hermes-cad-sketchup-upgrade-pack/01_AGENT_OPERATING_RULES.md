# Hermes Agent Operating Rules

Diese Regeln soll Hermes als dauerhafte Projektregeln verwenden.

## 1. Niemals blind bauen

Vor jeder neuen Funktion zuerst verstehen:

- Was ist das Nutzerproblem?
- Wie funktioniert die entsprechende Funktion in SketchUp oder vergleichbaren CAD-Programmen?
- Was kann Hermes CAD schon?
- Was fehlt?
- Welche Dateien/Module sind betroffen?
- Welche Tests müssen existieren?

## 2. Recherchepflicht

Jede Funktion braucht eine Recherche-Datei:

`docs/research/<feature>_research.md`

Mindestens enthalten:

- Offizielle Dokumentation.
- 2–5 YouTube-Videos mit beobachtbarem Workflow.
- 2–5 Google/Tutorial-Ergebnisse.
- 2–5 GitHub-Repos oder Open-Source-Beispiele, wenn vorhanden.
- 2–5 Forum/Community-Probleme.
- Zusammenfassung des erwarteten Verhaltens.
- Liste: Was darf nicht kopiert werden?

## 3. Keine fremden Assets

Verboten:

- SketchUp Icons.
- SketchUp Logos.
- SketchUp Screenshots als UI-Bestandteil.
- Exakte Kopie fremder Texte.
- Proprietärer Code.
- Lizenzunklare GitHub-Codeübernahmen.
- UI, die Markenverwechslung erzeugt.

Erlaubt:

- Verhalten analysieren.
- Workflow in eigenen Worten beschreiben.
- Eigenes UI bauen.
- Eigene Icons bauen.
- Offene Bibliotheken nutzen, wenn Lizenz kompatibel ist und dokumentiert wird.

## 4. Datenmodell vor Oberfläche

Keine Funktion ist fertig, wenn nur ein Button existiert. Jede Funktion braucht:

- Datenmodell.
- Commands/Actions.
- Undo/Redo.
- UI.
- Tests.
- Dokumentation.

## 5. Undo/Redo ist Pflicht

Jede Nutzeraktion muss ein Undo-Schritt sein.

Beispiele:

- Create Component = 1 Undo.
- Make Unique = 1 Undo.
- Rename Component Definition = 1 Undo.
- Change Dynamic Attribute = 1 Undo.
- Insert Component = 1 Undo.
- Drag Outliner Node = 1 Undo.

Keine Modelländerung beim bloßen Öffnen eines Panels.

## 6. Selection-Sync ist Pflicht

Auswahl muss synchron sein:

- 3D View → Entity Info
- 3D View → Outliner
- Outliner → 3D View
- Component Browser → Insert Tool
- Dynamic Options → ausgewählte Komponente

## 7. Fehlerfreundlichkeit

Fehlertexte kurz, ruhig und lösungsorientiert.

Schlecht:
`ERROR!!! INVALID COMPONENT`

Gut:
`Diese Auswahl kann nicht als Komponente gespeichert werden. Bitte wähle zuerst mindestens eine Fläche, Kante, Gruppe oder Komponente aus.`

## 8. Schreiner-Priorität

Bei jeder Entscheidung prüfen:

- Hilft das einem Schreiner?
- Hilft das beim Schrank/Korpus?
- Hilft das bei schneller Angebots-/Planungsarbeit?
- Hilft das bei Zuschnitt, Material, Beschlägen, Kanten?

## 9. Performance-Regel

Große Modelle müssen bedienbar bleiben:

- Outliner virtualisieren.
- Bibliotheken lazy laden.
- Dynamische Komponenten nur bei Änderung recalculaten.
- Formeln cachen.
- Undo-Speicher begrenzen/komprimieren.
- Kein komplettes Modell bei jeder Mausbewegung neu bauen.

## 10. Ergebnisbericht

Nach jedem Feature schreibt Hermes:

- Was wurde gebaut?
- Welche Dateien geändert?
- Welche Tests bestanden?
- Welche Quellen wurden genutzt?
- Welche offenen Punkte gibt es?
- Welche Risiken bestehen?
