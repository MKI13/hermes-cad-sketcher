# Bestehende Repo-Regeln nicht brechen

Hermes CAD hat bereits klare Regeln:

- `AGENTS.md` ist verbindlich.
- Keine direkten Commits auf `main`.
- `npm run check` vor Commit/PR.
- Millimeter als Basiseinheit.
- Keine falsche Kompatibilität mit SKP/DWG/RB/RBZ.
- SketchUp-ähnlich darf nur Workflow bedeuten, nicht Kopie.

## Rendering-spezifische Ergänzung

Jede Rendering-Funktion muss diese Regeln zusätzlich einhalten:

- Renderdaten sind Ergänzung, nicht Ersatz des CAD-Modells.
- Render-Materialien müssen mit Möbelbau-Materialien kompatibel sein.
- Der Agent darf Renderjobs nur über sichere Commands starten.
- Externe Renderer laufen nur über lokale Bridge und validierte Pfade.
- Kein automatisches Herunterladen fremder Texturen ohne Lizenzprüfung.
