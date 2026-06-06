# Rendering-Research-Log — 2026-06-06

## Ziel

Das Paket `hermes_cad_rendering_agent_logic_pack` wurde als Architektur- und Agent-Logik für den nächsten Hermes-CAD-Schritt übernommen. Ziel ist eine interne Render-Erweiterung im bestehenden Hermes CAD, ohne den maßgenauen CAD-Kern durch Render-Meshes zu ersetzen.

## Geprüfte Quellen

- Three.js Dokumentation — https://threejs.org/docs/ — HTTP 200 geprüft. Relevant für interne Live-Vorschau, MeshStandardMaterial, Licht/Kamera und PBR-nahe WebGL-Darstellung.
- Blender Cycles Manual — https://docs.blender.org/manual/en/latest/render/cycles/ — HTTP 200 geprüft. Relevant für spätere lokale Render-Bridge, nicht für den ersten internen CAD-Schritt.
- Khronos glTF 2.0 Spezifikation — https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html — HTTP 200 geprüft. Relevant für spätere GLB/glTF Export-Strategie.
- SketchUp Help Viewing Model — https://help.sketchup.com/en/sketchup/viewing-model — HTTP 200 geprüft. Nur als Workflow-Referenz; keine Icons, Markennamen, Farben oder UI-Kopien übernommen.

## Entscheidungen

1. Hermes CAD bleibt das Hauptprogramm.
2. Rendering wird zuerst als interner `Render-Workspace` vorbereitet.
3. Der CAD-Kern bleibt in Millimetern und wird nicht durch Renderer-Objekte ersetzt.
4. `RenderSceneSnapshot` ist die verbindliche Zwischenschicht für Preview, spätere Blender-Bridge und GLB/glTF Export.
5. Hermes Chat darf Rendering nur über validierte JSON-Befehle steuern. Freier JavaScript-/Ruby-/Shell-Code bleibt verboten.
6. Externe Renderjobs wie Blender/Cycles bleiben fail-closed, solange keine lokale Bridge läuft.

## Nicht übernommen

- Keine SketchUp-/Trimble-Assets.
- Keine SKP-, DWG-, `.rb`- oder `.rbz`-Kompatibilität behauptet.
- Keine zweite Render-App als erster Schritt gebaut.

## Implementierter Slice

- PBR-kompatible Render-Materialdefinitionen mit Validierung.
- `RenderSceneSnapshot` aus dem aktuellen `SketchModel`.
- Sichere Renderjob-Struktur für interne Three.js Preview und spätere lokale Bridge.
- Fail-closed Validierung strukturierter Render-Chat-Kommandos.
- Rechter Tray erhält einen sichtbaren `Render-Workspace` mit Snapshot-Status.
