# Hermes Chat und Rendering

Hermes Chat soll Rendering steuern, aber nicht unsicher Code ausführen.

## Prinzip

Der Nutzer schreibt natürlich:

> Mach das Holz realistischer und rendere ein Kundenbild.

Hermes übersetzt in sichere Befehle:

```json
{
  "type": "render.applyPreset",
  "presetId": "customer-interior-preview"
}
```

```json
{
  "type": "render.assignMaterial",
  "target": { "selection": true },
  "materialId": "oak-natural-matte"
}
```

```json
{
  "type": "render.startJob",
  "quality": "preview",
  "width": 1280,
  "height": 720
}
```

## Erlaubte Render-Befehle V1

- `render.applyPreset`
- `render.assignMaterial`
- `render.createMaterial`
- `render.setCameraFromCurrentView`
- `render.selectCamera`
- `render.setEnvironment`
- `render.addLight`
- `render.updateLight`
- `render.startPreview`
- `render.startJob`
- `render.cancelJob`

## Fail-closed Regeln

Hermes darf nicht raten, wenn:

- keine Auswahl vorhanden ist und Ziel unklar ist,
- Material unbekannt ist,
- Texturquelle unklar/lizenzrechtlich unsicher ist,
- Render-Bridge nicht läuft,
- Job-Pfad außerhalb erlaubtem Verzeichnis liegt.

Dann antwortet Hermes klar im Chat und schlägt die nächste sichere Aktion vor.
