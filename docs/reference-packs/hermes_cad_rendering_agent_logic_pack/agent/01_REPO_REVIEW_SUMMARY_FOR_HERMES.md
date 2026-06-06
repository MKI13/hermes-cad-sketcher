# Aktueller Repository-Review für Hermes

Repository: `MKI13/hermes-cad-sketcher`
Stand der Analyse: 2026-06-06

## Aktueller Stack

Der aktuelle Stack ist grundsätzlich richtig für die aktuelle Phase:

- TypeScript als Kernsprache für Modell, Befehle, Tests und UI-Logik.
- React für die Oberfläche.
- Vite für Dev-Server, Build und Preview.
- Three.js für Viewport, Picking, Vorschau und einfache 3D-Darstellung.
- Python Bridge für lokalen Hermes-Agent-Zugriff.
- Vitest und `npm run check` als Qualitätsgate.

## Warum TypeScript/React/Three.js richtig ist

Für einen SketchUp-ähnlichen Browser-/Linux-CAD-Prototyp ist TypeScript richtig, weil:

- UI, Werkzeugzustände und 3D-Viewport schnell iterierbar sind.
- Three.js schon im Projekt vorhanden ist.
- Modelllogik testbar in `src/core/` liegt.
- Browser-Zugriff vom zweiten PC über denselben Host möglich ist.
- Keine native Desktop-Abhängigkeit nötig ist.

## Was noch fehlt für ernstes Rendering

Aktuell sind Materialien im Kern hauptsächlich einfache Farbkataloge. Für Rendering fehlen:

- PBR-Materialparameter: baseColor, roughness, metalness, alpha, normalMap, roughnessMap, aoMap, textureScale.
- Materialzuweisung pro Bauteil/Face/Komponente mit sauberer Vererbung.
- Kameras als Szenenobjekte oder Render-Presets.
- Lichter: Sonne, Area Light, Spot, Point, Environment/HDRI.
- Render-Qualitätsstufen: Draft, Preview, Final.
- Exportfähiger Render-Snapshot: glTF/GLB als erster realistischer Weg, später optional USD.
- Trennung zwischen Arbeits-Viewport und Render-Viewport.
- Optionaler Bridge-Renderer für hochwertige Bilder.

## Wichtigste technische Warnung

Der CAD-Kern darf nicht zu einem reinen Mesh-Editor werden. Für EF-Sinn/Möbelbau müssen Bauteile semantisch bleiben:

- Korpus-Seite
- Boden
- Deckel
- Rückwand
- Front
- Tür
- Schublade
- Fachboden
- Beschlag/Bohrung
- Kantenband
- Material/Plattenstärke

Rendering darf daraus Meshes ableiten, aber das Modell muss weiter in echten Bauteilen, Komponenten und mm-Maßen leben.
