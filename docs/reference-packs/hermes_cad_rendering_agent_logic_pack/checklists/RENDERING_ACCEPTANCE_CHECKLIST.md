# Rendering Acceptance Checklist

Vor Merge einer Rendering-Funktion prüfen:

- [ ] `README.md` und `AGENTS.md` gelesen.
- [ ] Funktion ist klein genug für einen Commit/PR.
- [ ] Kein SketchUp-/Trimble-Icon, Logo oder geschütztes UI kopiert.
- [ ] CAD-Kern wird nicht durch Render-Meshes ersetzt.
- [ ] Millimeter bleiben Basiseinheit.
- [ ] Entity-/Component-IDs bleiben erhalten.
- [ ] Materialdaten sind validiert.
- [ ] Renderbefehle sind fail-closed.
- [ ] Keine freien Shell-/JS-/Ruby-Befehle aus Chat.
- [ ] Lokale Bridge bindet nur an `127.0.0.1`.
- [ ] Tests ergänzt oder begründet.
- [ ] `npm run check` grün.
- [ ] Dokumentation aktualisiert.
- [ ] Source-Log ergänzt.
