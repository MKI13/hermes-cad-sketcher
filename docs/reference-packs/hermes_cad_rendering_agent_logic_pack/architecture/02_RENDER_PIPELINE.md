# Render Pipeline für Hermes CAD

## Pipeline-V1: schnelle Live-Vorschau

```text
SketchModelSnapshot
  -> RenderSceneSnapshot
  -> Three.js Render Adapter
  -> WebGL/WebGPU Preview
```

Ziel: Im Hermes CAD Fenster schnell sehen, ob Material, Licht und Kamera stimmen.

## Pipeline-V2: hochwertige lokale Einzelbilder

```text
SketchModelSnapshot
  -> RenderSceneSnapshot
  -> glTF/GLB Export
  -> Local Render Bridge
  -> Blender Scene
  -> Cycles/EEVEE Render
  -> PNG/JPEG zurück an Hermes CAD
```

Ziel: realistische Bilder für Kunden, Angebote, Website, Vorschau.

## Pipeline-V3: späterer Live-Renderer

```text
SketchModel events
  -> Render event stream
  -> Hermes Render Viewer
  -> Live PBR/Pathtracing Viewer
```

Erst bauen, wenn V1 und V2 stabil sind.

## Datenfluss-Regel

Rendering bekommt Daten vom CAD-Modell. Rendering schreibt nicht ungeprüft zurück in das CAD-Modell.

Erlaubt zurückzuschreiben:

- Material-Zuweisung
- Kamera-Presets
- Licht-Presets
- Render-Presets
- Vorschau-Bild/Thumbnail

Nicht erlaubt:

- Geometrie durch Render-Mesh ersetzen
- Bauteil-IDs verlieren
- Komponenteninstanzen in Einzelmeshes zerstören
- Maße verändern
