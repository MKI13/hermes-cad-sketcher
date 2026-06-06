# Geplante Funktionen: Roadmap

## v0.3 — Funktionale SketchUp-Basis

Ziel:
Hermes CAD fühlt sich beim Grundmodellieren richtig an.

Enthält:
- Active Edit Context
- ComponentDefinition / ComponentInstance
- Make Unique
- Outliner Sync
- Measurement Box aktiv
- Inference/Snapping v1
- Push/Pull v1 stabil
- Command-based Undo/Redo

Keine neue dekorative UI ohne Funktion.

## v0.4 — Möbelbau/Korpus-System

Ziel:
Hermes CAD wird für Schränke, Küchen, Kleiderschränke und Korpusse produktiv.

Enthält:
- parametrische Korpus-Komponenten
- Bretter als eigene Komponenten
- local axes length/width/thickness
- Material + grain direction
- edge banding data
- Bohrungen/Verbinder als Metadaten oder Subfeatures
- OpenCutList-readiness validation
- Stücklisten-Vorbereitung

## v0.5 — Rendering Workspace

Ziel:
realistische Vorschau ohne CAD-Kern zu zerstören.

Enthält:
- RenderSceneSnapshot
- PBR Materialfelder
- Licht/Sonne/Umgebung
- Kamera/Scenes
- Schatten
- GLB Export
- optional lokale Blender/Cycles Bridge

## v0.6 — Datei-Bridge und Erweiterungen

Ziel:
offene Schnittstellen ohne falsche Kompatibilität.

Enthält:
- eigenes Hermes Extension Format `.hcad-extension.json`
- Extension Manifest
- Permissions
- sichere Commands
- GLB/OBJ export/import geprüft
- DWG/SKP Bridge-Forschung, aber nur wenn realistisch

## v1.0 — Stabiler CAD-Arbeitsplatz

Ziel:
Marios kann reale EF-Sinn-Projekte zuverlässig zeichnen.

Enthält:
- vollständige Kern-Workflows
- Versionierte Projektdateien
- CI + Browser Smoke
- Handbuch
- Backup/Rollback-Regeln
- keine falschen Marketingversprechen
