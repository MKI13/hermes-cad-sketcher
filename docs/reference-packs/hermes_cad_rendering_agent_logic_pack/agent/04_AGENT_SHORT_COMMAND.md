# Kurzbefehl für Hermes Agent

Kopiere diesen Text an Hermes, wenn er direkt im Repo arbeiten soll:

```text
Hermes, lies zuerst README.md und AGENTS.md vollständig. Prüfe den aktuellen Code in src/core, src/ui und tests. Ziel ist Hermes CAD Sketcher realistisch renderfähig zu machen, ohne den CAD-Kern zu beschädigen.

Wichtig: TypeScript/React/Vite/Three.js bleibt der Hauptstack. Keine komplette Neuschreibung. Rendering wird als interner Render Workspace plus optionaler lokaler Render-Bridge geplant. Hermes Chat darf Rendering nur über sichere JSON-Actions steuern, nicht über freien Code. Millimeter bleiben Basiseinheit. Entity- und Component-IDs müssen erhalten bleiben. Keine SketchUp-/Trimble-Icons, Logos, geschützte UI oder Marken kopieren.

Baue zuerst keine große Final-Rendering-Engine. Starte mit:
1. RenderSceneSnapshot unter src/render,
2. PBR-Materialmodell rückwärtskompatibel,
3. Render Workspace Panel im rechten Hermes Tray,
4. später GLB/glTF Export und lokale Blender-Bridge.

Vor jeder größeren Funktion: offizielle Docs und bestehende Lösungen recherchieren, Source Log schreiben, Tests ergänzen, npm run check ausführen. Keine ungeprüften Commits.
```
