# Hermes CAD Rendering & Architektur Agent-Logik Paket

Dieses Paket ist für den Hermes Agent gedacht, damit Hermes CAD Sketcher sauber weiterentwickelt wird:

- SketchUp-ähnlicher CAD-Workflow, aber rechtlich eigenständig.
- Realistisches Rendering in Zukunft vorbereiten, ohne den CAD-Kern kaputtzumachen.
- Aktuellen Code-Stack richtig einordnen: TypeScript + React + Vite + Three.js + Python Bridge.
- Komponenten, Materialien, Szenen, Render-Presets und Agent-Befehle so strukturieren, dass später Live-Preview, Fotorealismus und externe Render-Bridge möglich sind.

## Wichtigste Entscheidung

Hermes soll **kein komplett separates Rendering-Programm als ersten Schritt** bauen. Beste Lösung:

1. **Hermes CAD bleibt das Hauptprogramm** für Modellieren, Komponenten, Maße, Möbelbau und Bearbeitung.
2. Im Hermes CAD Fenster entsteht ein **interner Render-Workspace**: eigener Panel/Tab/Modus für Materialien, Licht, Kamera, Schatten, Umgebungen und schnelle Live-Vorschau.
3. Zusätzlich wird eine **optionale lokale Render-Bridge** vorbereitet, z. B. für Blender/Cycles oder später andere Renderer. Diese Bridge bekommt einen sauberen Szenen-Snapshot und gibt Bild/Preview zurück.
4. Der Hermes Chat darf Rendering nicht nur als freien Text erzeugen. Er soll strukturierte Befehle liefern: Material setzen, Licht setzen, Kamera setzen, Render-Preset wählen, Renderauftrag starten.
5. Erst später, wenn Performance oder Qualität es verlangen, kann ein zweites Live-Viewer-Programm entstehen. Dann aber über denselben Snapshot-/Event-Stream, nicht als neue parallele Wahrheit.

## Dateistruktur

- `agent/` — direkte Prompts und Arbeitsregeln für Hermes Agent
- `architecture/` — technische Architektur, Stack-Entscheidung, Render-Bridge, Datenmodell
- `rendering/` — Materialsystem, Licht/Kamera, Export, Live-Vorschau, Blender-Bridge
- `issues/` — GitHub-Issue-Vorlagen für die nächsten Schritte
- `checklists/` — Prüf- und Acceptance-Checklisten
- `schemas/` — JSON/YAML-Entwürfe für Renderjobs, Materialien und Extension-Manifest
- `examples/` — Beispielbefehle für Hermes Chat und Render-DSL

## Absolute Regeln

- Keine SketchUp-/Trimble-Icons, Logos, Marken oder 1:1 kopierte UI-Elemente verwenden.
- SketchUp darf nur als Funktions-/Workflow-Referenz recherchiert werden.
- Immer Quellen prüfen: YouTube, Google, GitHub, offizielle Dokumentation, vorhandener Code.
- Keine ungeprüften Commits.
- Immer `npm run check` vor Commit/PR.
- Millimeter bleiben die Wahrheit im CAD-Kern.
- Rendering darf den CAD-Kern nicht verändern.
