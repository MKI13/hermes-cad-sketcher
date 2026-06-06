# Issue: PBR-Materialsystem rückwärtskompatibel erweitern

## Ziel

Materialien von einfacher Farbe auf renderfähige PBR-Parameter erweitern.

## Aufgaben

- `MaterialDefinition` um optionale PBR-Felder erweitern oder neues `RenderMaterialDefinition` ergänzen.
- Default-Materiale für Möbelbau ergänzen:
  - Eiche natur matt
  - Weiß lackiert matt
  - MDF roh
  - Multiplex
  - Glas transparent
  - Metall gebürstet
- Validierung für roughness/metalness/opacity.
- Materialvererbung vorbereiten.
- Tests für Normalisierung und alte Projekte.

## Acceptance Criteria

- Bestehende Materialien mit `id/name/color` funktionieren weiter.
- PBR-Werte werden validiert.
- Render-Snapshot bekommt PBR-Materiale.
- UI zeigt einfache Regler ohne Überladung.
- `npm run check` grün.
