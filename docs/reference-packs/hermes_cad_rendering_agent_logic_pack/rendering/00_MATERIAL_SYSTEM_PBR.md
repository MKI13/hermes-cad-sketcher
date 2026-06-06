# PBR-Materialsystem für realistisches Rendering

Aktuell hat Hermes CAD einfache Materialien mit Name und Hex-Farbe. Für realistisches Rendering braucht Hermes eine erweiterte, aber rückwärtskompatible Materialstruktur.

## Ziel

Materialien sollen für Möbelbau funktionieren:

- Spanplatte weiß
- MDF
- Multiplex
- Massivholz Eiche
- Furnier
- Lack matt/glänzend
- Glas
- Metall/Beschläge
- Kunststoff/Kante

## Neue Materialstruktur

```ts
export type RenderMaterialDefinition = {
  id: string;
  name: string;
  category: 'wood' | 'board' | 'veneer' | 'paint' | 'metal' | 'glass' | 'plastic' | 'generic';
  baseColor: string;
  roughness: number;      // 0..1
  metalness: number;      // 0..1
  opacity?: number;       // 0..1
  transparent?: boolean;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  aoMapUrl?: string;
  colorMapUrl?: string;
  textureScaleMm?: { x: number; y: number };
  grainDirection?: 'x' | 'y' | 'z' | 'auto-panel-long-edge';
  source?: {
    kind: 'builtin' | 'user-upload' | 'library';
    license?: string;
    url?: string;
  };
};
```

## Wichtige Regeln

- Materialwerte werden validiert: keine negativen Werte, keine unsicheren URLs.
- Texturen dürfen nicht als riesige base64-Daten dauerhaft in normalen Projektdateien explodieren.
- Für Holz muss Maserungsrichtung vorbereitet werden.
- Für Möbelbau soll Material nicht nur schön aussehen, sondern später Zuschnitt/Kantenband unterstützen.
- Materialvererbung: Entity > Face > Component Instance > Component Definition > Default.

## Tests

- Default-Materiale bleiben kompatibel.
- Ungültige Farben werden abgelehnt.
- PBR-Werte werden auf 0..1 begrenzt.
- Snapshot lädt alte `.hcad.json` weiter.
- Export behält Material-IDs.
