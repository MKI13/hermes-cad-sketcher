# Issue: Optionale lokale Blender Render-Bridge planen und MVP bauen

## Ziel

Eine lokale Bridge vorbereiten, die aus Hermes Renderjobs hochwertige Bilder erzeugt.

## Aufgaben

- Endpoint planen: `/hermes-cad/render-job`.
- JSON-Schema validieren.
- Temporäres Arbeitsverzeichnis definieren.
- GLB/RenderSceneSnapshot als Input verwenden.
- Blender nur lokal über erlaubten Pfad starten.
- Renderstatus zurückgeben.
- Sicherheitsregeln dokumentieren.

## Acceptance Criteria

- Bridge bindet nur an `127.0.0.1`.
- Kein freier Shell-Code aus Chat.
- Renderjob mit ungültigen Pfaden wird abgelehnt.
- Fehler werden im UI verständlich angezeigt.
- `npm run check` bleibt grün; Bridge-Tests separat dokumentieren.
