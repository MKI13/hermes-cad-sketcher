# ADR: RenderSceneSnapshot als Rendering-Grenze

## Status

Angenommen für `feature/rendering-agent-logic-20260606-185749`.

## Kontext

Hermes CAD braucht realistischere Materialien, Licht, Kamera, Render-Presets und später eine lokale Render-Bridge. Gleichzeitig muss der CAD-Kern maßgenau, komponentenfähig und für Möbelbau/Fertigung geeignet bleiben.

## Entscheidung

Rendering bekommt eine eigene, testbare Zwischenschicht:

- `src/core/rendering.ts` erzeugt einen `RenderSceneSnapshot` aus dem `SketchModel`.
- Der Snapshot bleibt in Millimetern und enthält Mapping zurück auf Entity-/Component-IDs.
- PBR-Materialien werden aus den vorhandenen CAD-Materialien abgeleitet und validiert.
- Renderjobs referenzieren den Snapshot und erzwingen sichere Bildgrößen/Samples.
- Chat-/Agent-Befehle werden in `src/core/renderCommands.ts` fail-closed validiert.

## Folgen

- Three.js Preview, GLB/glTF Export und Blender/Cycles Bridge können später dieselbe Datenstruktur lesen.
- Der CAD-Kern muss keine Three.js- oder Blender-spezifischen Objekte speichern.
- Externe Renderjobs können sicher blockiert werden, solange keine lokale Bridge aktiv ist.
- Die UI kann Rendering vorbereiten, ohne Fertigungs-/Modelllogik zu beschädigen.

## Rollback

Siehe `docs/releases/2026-06-06-rendering-agent-logic.md` und Git-Tag `rollback/pre-rendering-agent-logic-20260606-185749`.
