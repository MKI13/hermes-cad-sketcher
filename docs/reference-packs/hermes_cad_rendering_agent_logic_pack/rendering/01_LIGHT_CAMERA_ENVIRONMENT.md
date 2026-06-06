# Licht, Kamera und Umgebung

## Render-Kamera

Hermes braucht eigene Render-Kameras, getrennt von der Arbeitskamera.

```ts
export type RenderCamera = {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  focalLengthMm?: number;
  fovDeg?: number;
  sensorWidthMm?: number;
  orthographic?: boolean;
  orthographicScaleMm?: number;
};
```

## Lichttypen

```ts
export type RenderLight =
  | { id: string; type: 'sun'; name: string; direction: [number, number, number]; intensity: number; color: string }
  | { id: string; type: 'area'; name: string; position: [number, number, number]; target?: [number, number, number]; widthMm: number; heightMm: number; intensity: number; color: string }
  | { id: string; type: 'point'; name: string; position: [number, number, number]; intensity: number; color: string }
  | { id: string; type: 'spot'; name: string; position: [number, number, number]; target: [number, number, number]; angleDeg: number; intensity: number; color: string };
```

## Umgebung

```ts
export type RenderEnvironment = {
  kind: 'solidColor' | 'gradient' | 'hdri' | 'studio';
  backgroundColor?: string;
  hdriUrl?: string;
  intensity?: number;
  rotationDeg?: number;
};
```

## Presets

Hermes soll mit einfachen Presets beginnen:

- `Werkstatt Vorschau`: hell, neutral, schnell.
- `Kundenbild Innenraum`: warme Area-Lights, Schatten, PBR.
- `Produkt weißer Hintergrund`: Kamera frontal, Studio-Licht.
- `Dunkler Hintergrund`: kontrastreich für Website/Portfolio.

## Regel

Render-Kamera darf die Arbeitskamera übernehmen, aber danach als eigenes Preset gespeichert werden.
