# Aktueller Repository-Befund

Repository: `MKI13/hermes-cad-sketcher`

## Stack

Der aktuelle Stack ist richtig für die jetzige Phase:

- TypeScript
- React
- Vite
- Three.js
- Vitest
- `lucide-react`
- lokale Python-Agent-Bridge

Warum richtig:
- React/Vite ist schnell für lokale Browser-CAD-UI.
- TypeScript gibt klare Modelltypen.
- Three.js ist passend für interaktiven 3D-Viewport.
- Vitest ermöglicht testbare Kernlogik.
- Die lokale Agent-Bridge schützt API-Keys und hält den Browser sicher.

## Vorhandene Funktionen laut Repository

Aus README/AGENTS und Code ableitbar:

- Millimeter als Basiseinheit
- Kernmodell in TypeScript
- Linien
- Rechtecke/Flächen
- Boxkörper
- Three.js-Viewport
- Orbit-Ansicht
- Zoom auf Mauspunkt
- Auswahl/Picking
- Live-Vorschau beim Zeichnen
- Move per Maus und präzise ΔX/ΔY/ΔZ
- Rotate um Z-Achse
- Push/Pull-Grundfunktion
- auswählbare Box-Faces
- Face-Extrusion für achsenparallele Rechtecke
- Maßband
- Measurement-Anzeige
- Undo/Redo über Snapshots
- Komponenten/Gruppen-Grundlage
- Komponenten-Duplizierung
- Tags
- Materialien
- Right Tray / Panels
- Inspector
- Outliner
- Material-/Tag-Panels
- Szenen/Styles als UI-Bereiche
- `.hcad.json` Projektformat
- DXF Import/Export nur für eng definierte Teilmenge
- STL Export für Boxkörper
- ASCII-STL Referenzmesh-Import
- Ruby-ähnliche sichere Hermes-CAD-DSL
- Hermes Agent Bridge
- CI / `npm run check`

## Größte Lücken

1. Komponenten sind noch nicht vollständig SketchUp-ähnlich:
   - aktuell noch zu sehr `entityIds`/kopierte Gruppen
   - gebraucht: `ComponentDefinition` + `ComponentInstance` + lokale Transformation
   - gebraucht: Make Unique
   - gebraucht: aktiver Bearbeitungskontext

2. Push/Pull ist noch nicht vollständig:
   - aktuell vor allem Boxseiten und axis-aligned Rechtecke
   - gebraucht: beliebige planare Faces, Normalenrichtung, Cut/Extrude-Semantik, Wiederholfunktion, genaue Maßeingabe

3. Measurement Box muss wie ein aktives Eingabefeld funktionieren:
   - nicht nur Anzeige
   - Eingabe direkt nach Werkzeugaktion
   - Werte wie `1200`, `1200mm`, `1200,600`, `3x`, `3/` für spätere Arrays

4. Inference/Snapping muss stark erweitert werden:
   - Endpunkt
   - Mittelpunkt
   - Kante
   - Face
   - Achsenlock
   - Parallel/Perpendicular
   - On Face / On Edge / From Point
   - sichtbare Snap-Cues

5. UI muss immer funktional bleiben:
   - keine leeren Buttons
   - keine halben Dialoge
   - klare deaktivierte Zustände für geplante Funktionen
   - Viewport muss priorisiert bleiben

6. Rendering darf nicht in den CAD-Kern gemischt werden:
   - Render-Szene separat aus CAD-Modell ableiten
   - CAD-Geometrie bleibt Wahrheit

7. Datei-Kompatibilität muss ehrlich bleiben:
   - keine falsche DWG/SKP/STEP/IFC-Versprechen
   - Import/Export nur als unterstützt dokumentieren, wenn Tests und Fixtures vorhanden sind

## Grundsatz

Maße zuerst. Stabilität zuerst. Modelllogik zuerst. UI danach. Optik zuletzt.
