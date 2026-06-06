# Soll Hermes ein zweites Live-Rendering-Programm bauen?

## Kurzentscheidung

Noch nicht als erster Schritt.

## Warum nicht sofort?

Ein zweites Live-Programm erhöht die Komplexität:

- Synchronisation zwischen CAD und Renderer.
- Zwei UI-Zustände.
- Zwei Programme installieren/starten.
- Fehlerquellen bei Netzwerk/Bridge.
- Modell kann auseinanderlaufen.

## Bessere Reihenfolge

1. Render-Datenmodell und PBR-Materialien in Hermes CAD.
2. Interner Render Workspace mit Three.js Preview.
3. Export/RenderSceneSnapshot.
4. Lokale Render-Bridge für Finalbilder.
5. Erst danach optional `Hermes Render Viewer`.

## Wann ein zweites Programm sinnvoll wird

- Marios möchte auf zweitem Monitor permanent realistische Vorschau sehen.
- Große Modelle machen das CAD-Fenster langsam.
- GPU/RTX-Renderer soll getrennt laufen.
- Mehrere Clients sollen dieselbe Szene nur anschauen.
- Renderprozess soll nicht den CAD-Editor blockieren.

## Spätere Architektur

```text
Hermes CAD Editor
  -> WebSocket/Snapshot Stream
  -> Hermes Render Viewer
       -> Live PBR Renderer
       -> optional path tracing
       -> keine CAD-Bearbeitung
```

## Regel

Der Render Viewer ist nur Spiegel/Renderer. Bearbeitet wird weiterhin in Hermes CAD.
