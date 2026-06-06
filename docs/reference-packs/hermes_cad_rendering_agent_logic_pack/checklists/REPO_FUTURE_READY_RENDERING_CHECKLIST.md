# Zukunftsfähigkeit für realistisches Rendering

Hermes Agent muss bei jeder CAD-Funktion prüfen:

## Modell

- [ ] Bauteile bleiben getrennt und semantisch.
- [ ] Komponenten behalten IDs.
- [ ] Material kann später pro Entity/Face/Component gesetzt werden.
- [ ] Maße bleiben in mm.
- [ ] Keine unnötigen Mesh-Only-Strukturen.

## UI

- [ ] Funktion passt in bestehenden Tray/Toolbar/Window-Ansatz.
- [ ] Keine UI-Kopie von SketchUp.
- [ ] Tool bleibt mit Tastatur/Maus bedienbar.
- [ ] Arbeitsfläche bleibt frei.

## Rendering

- [ ] Funktion kann in RenderSnapshot abgebildet werden.
- [ ] Es gibt eine klare Three.js-Darstellung.
- [ ] Es gibt einen Pfad zu glTF/GLB.
- [ ] Material/Licht/Kamera werden nicht hart im CAD-Kern codiert.

## Agent

- [ ] Chat-Befehl nutzt sichere JSON-Actions.
- [ ] Fail-closed bei unklarer Auswahl.
- [ ] Keine Systembefehle.
