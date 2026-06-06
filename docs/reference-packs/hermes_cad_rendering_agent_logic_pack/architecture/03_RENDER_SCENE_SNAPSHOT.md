# RenderSceneSnapshot: verbindliche Zwischenschicht

Hermes braucht eine getrennte Render-Snapshot-Struktur. Nicht direkt Three.js-Objekte in `.hcad.json` speichern.

## Ziel

Ein `RenderSceneSnapshot` beschreibt, wie das CAD-Modell visuell gerendert wird:

- Einheiten
- Meshes oder abgeleitete Geometrie
- Komponenteninstanzen
- Materialien
- Texturen
- Licht
- Kamera
- Umgebung
- Render-Qualität
- Mapping zurück zu Entity-/Component-IDs

## Beispiel

```ts
export type RenderSceneSnapshot = {
  version: 1;
  unit: 'mm';
  sourceProjectId?: string;
  objects: RenderObject[];
  materials: RenderMaterial[];
  cameras: RenderCamera[];
  lights: RenderLight[];
  environment?: RenderEnvironment;
  presets: RenderPreset[];
};

export type RenderObject = {
  id: string;
  sourceEntityId?: string;
  sourceComponentId?: string;
  name: string;
  kind: 'box' | 'face' | 'edge' | 'referenceMesh' | 'generatedMesh';
  transform: {
    position: [number, number, number];
    rotationEuler: [number, number, number];
    scale: [number, number, number];
  };
  mesh?: RenderMeshRef;
  materialId?: string;
  visible: boolean;
  selectable: boolean;
};
```

## Warum diese Schicht wichtig ist

- Three.js kann ersetzt oder ergänzt werden.
- Blender-Bridge kann denselben Snapshot lesen.
- glTF/GLB Export kann daraus gebaut werden.
- Material-/Licht-Presets sind testbar.
- Agent-Befehle können validiert werden.
- CAD-Kern bleibt sauber.
