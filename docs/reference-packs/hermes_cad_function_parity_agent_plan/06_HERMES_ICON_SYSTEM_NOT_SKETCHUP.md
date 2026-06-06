# Hermes-CAD Icon-System — ähnlich verständlich, aber nicht SketchUp kopieren

Hermes CAD nutzt eigene Icons. Keine SketchUp-/Trimble-Icons, keine Screenshots, keine nachgezeichneten Originalsymbole.

Empfehlung:
- Basis: `lucide-react`, weil es bereits im Projekt als Dependency vorhanden ist.
- Stil: 24x24, 2px Stroke, runde Enden, klare Hermes-CAD-Akzentform.
- Zusätzlich eigene kleine Overlay-Markierungen, z. B. roter/ grüner/ blauer Achspunkt, aber keine SketchUp-Icons.

## Icon-Regeln

1. Icon muss Funktion sofort erklären.
2. Icon darf dem SketchUp-Icon nicht zum Verwechseln ähnlich sein.
3. Jeder Toolbutton hat Label + Tooltip.
4. Tooltip erklärt die Handlung, nicht nur den Namen.
5. Icon-Map wird zentral gepflegt: `src/ui/icons/hermes-cad-icon-map.ts`.
6. Für geplante Funktionen: Icon grau + Badge `geplant`.
7. Für experimentelle Funktionen: Badge `beta`.

## Empfohlene Icon-Liste

| Hermes Tool | Verständliches Icon-Konzept | Lucide-Kandidat | Tooltip |
|---|---|---|---|
| Auswahl | Mauszeiger mit kleinem Punkt | `MousePointer2` | Objekt oder Geometrie auswählen |
| Linie | schräge Linie mit Start/Endpunkt | `PenLine` oder eigenes SVG | Linie mit zwei Punkten zeichnen |
| Rechteck | leeres Rechteck mit Eckpunkt | `Square` | Rechteck über zwei Punkte zeichnen |
| Körper/Box | einfacher 3D-Würfel | `Box` oder `Cuboid` | Boxkörper mit festen Maßen erzeugen |
| Push/Pull | Fläche mit Pfeil nach außen | eigenes SVG: Quadrat + Pfeil | Fläche drücken oder ziehen |
| Verschieben | 3D-Pfeilkreuz | `Move3D` | Auswahl verschieben |
| Drehen | Kreis-Pfeil um Achse | `Rotate3D` oder `RotateCw` | Auswahl drehen |
| Skalieren/Resize | Ecke mit Diagonalpfeil | `Maximize2` | Größe ändern |
| Maßband | Lineal | `Ruler` | Abstand messen |
| Measurement Box | kleines Eingabefeld + Lineal | eigenes SVG | Präzise Werte eingeben |
| Orbit | Kreis um Würfel | `Orbit` oder eigenes SVG | Ansicht drehen |
| Pan | Hand | `Hand` | Ansicht verschieben |
| Zoom | Lupe | `ZoomIn` / `ZoomOut` | Ansicht zoomen |
| Zoom Extents | vier Pfeile zum Rahmen | `Scan` oder eigenes SVG | Alles sichtbar machen |
| Gruppe erstellen | verbundene Quadrate | `Group` oder `Boxes` | Auswahl gruppieren |
| Komponente erstellen | Bausteine/Blueprint | `Component` oder `Blocks` | Wiederverwendbare Komponente erstellen |
| Make Unique | Kopie mit Stern | `CopyPlus` + `Sparkles` | Instanz einzigartig machen |
| Explode | getrennte Bausteine | `Ungroup` | Gruppe/Komponente auflösen |
| Outliner | Baum-Liste | `ListTree` | Modellhierarchie anzeigen |
| Tags | Etiketten | `Tags` | Sichtbarkeit/Organisation steuern |
| Materialien | Farbeimer/Palette | `PaintBucket` oder `Palette` | Material zuweisen |
| Komponentenbibliothek | Ordner mit Würfel | `FolderOpen` + `Box` | Komponenten verwalten |
| Szenen | Kamera | `Camera` | Ansicht/Szene speichern |
| Styles/Anzeige | Auge + Palette | `Eye` + `Palette` | Anzeigestil ändern |
| Verbergen | Auge durchgestrichen | `EyeOff` | Auswahl ausblenden |
| Anzeigen | Auge | `Eye` | Sichtbar machen |
| Sperren | Schloss | `Lock` | Objekt sperren |
| Entsperren | offenes Schloss | `Unlock` | Objekt entsperren |
| Löschen | Papierkorb | `Trash2` | Auswahl löschen |
| Rückgängig | Pfeil zurück | `Undo2` | Rückgängig |
| Wiederholen | Pfeil vorwärts | `Redo2` | Wiederholen |
| Speichern | Diskette/Datei | `Save` | Projekt speichern |
| Laden | Ordner öffnen | `FolderOpen` | Projekt laden |
| Export | Datei raus | `FileDown` | Datei exportieren |
| Import | Datei rein | `FileUp` | Datei importieren |
| Agent Chat | Bot/Spark | `Bot` | Hermes Agent öffnen |
| Konsole/DSL | Terminal | `Terminal` | Befehls-Konsole öffnen |
| Rendering | Sonne/Kamera | `SunMedium` + `Camera` | Render Workspace öffnen |

## Eigene SVGs, wenn Lucide nicht reicht

Für CAD-spezifische Werkzeuge sollte Hermes eigene SVGs erstellen:

- Push/Pull: Quadratfläche + extrudierender Pfeil
- Face Select: Fläche mit markierter Ecke
- Inference Point: kleiner Kreis mit Kreuz
- Axis Lock: rote/grüne/blaue Achsenlinien
- Make Component: Würfel mit Blueprint-Rahmen
- Korpus: Schrankkörper mit Seitenwand/Einlegeboden
- Edging: Brettkante mit dünnem Streifen

## Icon Acceptance Test

Jedes neue Icon wird akzeptiert, wenn:

- es als eigenständige Datei oder zentrale Map vorhanden ist,
- es nicht aus SketchUp kopiert ist,
- Label und Tooltip vorhanden sind,
- Toolbar und Menü denselben Icon-Namen nutzen,
- Tests oder Snapshot/DOM-Test bestätigen, dass das Icon geladen wird,
- `npm run check` grün ist.
