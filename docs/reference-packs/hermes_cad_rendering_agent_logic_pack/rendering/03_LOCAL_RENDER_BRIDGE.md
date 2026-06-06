# Lokale Render-Bridge

## Zweck

Die lokale Render-Bridge erzeugt hochwertige Bilder, ohne dass der Browser alles selbst rendern muss.

## V1-Bridge

Empfohlener erster Renderer: Blender über lokale Python-/CLI-Bridge.

Warum:

- Lokal auf Linux möglich.
- Kann per Kommandozeile Renderjobs ausführen.
- Kann glTF/GLB importieren.
- Hat EEVEE für schnelle Vorschau und Cycles für realistischere Finalbilder.

## Architektur

```text
Hermes CAD Browser
  -> POST /hermes-cad/render-job
  -> lokale Bridge 127.0.0.1
  -> schreibt temporäre GLB/JSON/Blend-Datei
  -> startet Blender headless oder nutzt Python API
  -> rendert PNG/JPEG
  -> gibt Renderstatus + Bildpfad/Thumbnail zurück
```

## Sicherheitsregeln

- Bridge bindet nur an `127.0.0.1`, nicht offen im LAN.
- Keine freien Shell-Befehle aus dem Chat ausführen.
- Renderjobs sind JSON-validiert.
- Dateipfade bleiben in einem erlaubten Projekt-/Temp-Verzeichnis.
- Keine externen Texturen ohne explizite Prüfung herunterladen.

## Renderjob Beispiel

```json
{
  "version": 1,
  "engine": "blender-cycles",
  "quality": "preview",
  "width": 1280,
  "height": 720,
  "samples": 64,
  "sceneSnapshotPath": "/tmp/hermes/render-scene.json",
  "outputPath": "/tmp/hermes/render-output.png"
}
```

## Nicht in V1

- Kein Live-Pathtracing-Streaming.
- Keine Cloud-Renderfarm.
- Keine Online-Uploads.
- Keine automatische Installation großer Renderer ohne Nutzerfreigabe.
