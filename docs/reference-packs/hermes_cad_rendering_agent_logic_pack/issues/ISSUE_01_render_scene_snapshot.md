# Issue: RenderSceneSnapshot als getrennte Rendering-Zwischenschicht einführen

## Ziel

Eine testbare Render-Snapshot-Schicht ergänzen, die das vorhandene `SketchModelSnapshot` in eine renderfähige Szene übersetzt, ohne den CAD-Kern zu verändern.

## Aufgaben

- Neuen Ordner `src/render/` anlegen.
- Typen definieren:
  - `RenderSceneSnapshot`
  - `RenderObject`
  - `RenderMaterial`
  - `RenderCamera`
  - `RenderLight`
  - `RenderEnvironment`
- Adapter schreiben: `createRenderSceneSnapshot(modelSnapshot)`.
- Entity-/Component-IDs in RenderObjects erhalten.
- Unit `mm` erhalten.
- Tests ergänzen.

## Acceptance Criteria

- Alte `.hcad.json` Projekte bleiben ladefähig.
- RenderSnapshot enthält alle sichtbaren Entities.
- IDs bleiben erhalten.
- Keine Geometrie wird im Modell verändert.
- `npm run check` grün.

## Nicht Teil dieses Issues

- Blender-Bridge.
- Finales Fotorealismus-Rendering.
- Externes Live-Viewer-Programm.
