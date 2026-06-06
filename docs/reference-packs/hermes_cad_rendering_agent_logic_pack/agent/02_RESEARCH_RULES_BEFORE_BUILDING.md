# Recherche-Regeln vor jeder Erweiterung

Hermes Agent muss vor jeder größeren neuen Funktion recherchieren.

## Pflichtquellen

1. Aktueller Repository-Code
   - `README.md`
   - `AGENTS.md`
   - `src/core/`
   - `src/ui/`
   - `tests/`

2. Offizielle Dokumentation
   - Three.js Docs für Viewport, Materialien, Exporter, Postprocessing, WebGPU/WebGL.
   - Khronos glTF 2.0 Spezifikation für Render-/Asset-Export.
   - Blender Manual für Batch-Rendering und Cycles/EEVEE, wenn eine lokale Render-Bridge gebaut wird.
   - OpenUSD Dokumentation erst später, wenn komplexe Szenen-Pipelines nötig werden.

3. SketchUp-Funktionsverhalten
   - Nur zum Verstehen von Workflows: Komponenten, Outliner, Materialdialog, Styles, Szenen, Schatten.
   - Keine Icons, keine Logos, keine UI-Kopie.
   - Keine geschützte SketchUp-API nachbauen.

4. YouTube/Google/GitHub
   - YouTube: nur für Bediengefühl und Workflow-Studium.
   - Google: für aktuelle Docs, Beispiele, bekannte Probleme.
   - GitHub: nur Repos mit passender Lizenz; keine Kopie ohne Lizenzprüfung.

## Source-Log Pflicht

Für jede größere Erweiterung muss Hermes eine Datei oder PR-Notiz mit folgender Struktur schreiben:

```md
# Source Log

## Ziel der Recherche

## Geprüfte Quellen
- Quelle:
  - URL:
  - Datum geprüft:
  - Was gelernt:
  - Was wird übernommen:
  - Was wird nicht übernommen:
  - Lizenz-/Marken-Risiko:

## Entscheidung

## Offene Risiken
```

## Stop-Regeln

Hermes muss abbrechen oder kleiner planen, wenn:

- Funktion zu groß für einen Commit ist.
- Tests fehlen und nicht sinnvoll ergänzt werden.
- Lizenz unklar ist.
- Funktion existierende Modelllogik gefährdet.
- Rendering den CAD-Kern mutieren würde.
