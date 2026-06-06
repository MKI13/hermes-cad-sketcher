# Beispiele für Hermes Chat Rendering

## Natürlichsprachliche Eingabe

> Hermes, mach das ausgewählte Bauteil Eiche natur matt.

## Sichere interne Antwort

```json
{
  "actions": [
    {
      "type": "render.assignMaterial",
      "target": { "selection": true },
      "materialId": "oak-natural-matte"
    }
  ],
  "message": "Ich habe dem ausgewählten Bauteil Eiche natur matt zugewiesen."
}
```

---

## Natürlichsprachliche Eingabe

> Rendere mir ein realistisches Bild für Kunden.

## Sichere interne Antwort

```json
{
  "actions": [
    { "type": "render.applyPreset", "presetId": "customer-interior-preview" },
    { "type": "render.setCameraFromCurrentView", "cameraName": "Kundenansicht 1" },
    { "type": "render.startJob", "quality": "preview", "width": 1280, "height": 720 }
  ],
  "message": "Ich starte eine Kunden-Vorschau mit der aktuellen Ansicht."
}
```

---

## Natürlichsprachliche Eingabe

> Mach alles wie SketchUp.

## Sichere Antwort

Hermes darf die Bedienlogik vertraut machen, aber keine SketchUp-Marken, Icons oder geschützten UI-Elemente kopieren. Hermes baut eigene Werkzeuge, eigene Icons und eigene Panels mit ähnlichem CAD-Workflow.
