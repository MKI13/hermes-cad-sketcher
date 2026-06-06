# glTF/GLB Exportstrategie für Rendering

## Entscheidung

Für Rendering ist glTF/GLB der erste sinnvolle Austauschweg.

## Warum glTF/GLB

- Unterstützt Szenen, Nodes, Hierarchie, Meshes, Materialien, Texturen und Kameras.
- Passt gut zu Three.js und Blender.
- GLB kann alles in einer Datei bündeln.
- Gut für Runtime-/Viewport-Rendering.

## Wichtige Einschränkung

glTF ist ein Render-/Assetformat, kein vollständiges CAD-Format. Es ersetzt nicht `.hcad.json` und nicht das semantische CAD-Modell.

## Mapping

```text
SketchModel BoxEntity       -> glTF mesh/node
Component Definition        -> glTF node/mesh reuse or extension metadata
Component Instance          -> glTF node transform
MaterialDefinition/PBR      -> glTF material
Tag/Layer visibility        -> extras metadata
EntityId/ComponentId        -> node.extras.hermes
```

## Pflichtregel

Beim Export müssen IDs in `extras` erhalten bleiben:

```json
"extras": {
  "hermes": {
    "entityId": "box_12",
    "componentId": "component_3",
    "unit": "mm",
    "semanticType": "cabinet_side"
  }
}
```

## Tests

- Export enthält alle sichtbaren Boxen.
- Unsichtbare Tags werden optional ausgeschlossen.
- Materialien bleiben erhalten.
- IDs bleiben in extras erhalten.
- Millimeter werden korrekt dokumentiert.
