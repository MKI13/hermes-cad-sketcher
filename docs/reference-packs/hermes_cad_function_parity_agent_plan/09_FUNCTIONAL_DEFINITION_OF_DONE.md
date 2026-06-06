# Definition of Done: keine halben Funktionen

Eine Hermes CAD Funktion ist nur dann fertig, wenn alle Punkte erfüllt sind.

## Pflicht

- [ ] Funktion ist im Modell/Kern implementiert.
- [ ] Funktion ist über UI oder Agent-DSL nutzbar.
- [ ] Funktion arbeitet in Millimeter.
- [ ] Ungültige Eingaben werden blockiert.
- [ ] Fehler werden verständlich angezeigt.
- [ ] Undo/Redo funktioniert.
- [ ] Save/Load erhält Zustand.
- [ ] Selection/ActiveContext bleibt korrekt.
- [ ] Tests vorhanden.
- [ ] `npm run check` grün.
- [ ] README/AGENTS/CHANGELOG aktualisiert.
- [ ] Issue-Kommentar mit Proof Bundle.
- [ ] Rollback-Hinweis vorhanden.
- [ ] SketchUp-Verhaltensvergleich dokumentiert.
- [ ] Keine SketchUp-/Trimble-Assets kopiert.

## UI-Funktionen zusätzlich

- [ ] Button/Panel ist nicht dekorativ.
- [ ] Tooltip vorhanden.
- [ ] Tastenkürzel dokumentiert, falls vorhanden.
- [ ] Disabled/Experimental/Ready Status korrekt.
- [ ] Fokus/Keyboard funktioniert.
- [ ] Keine destruktiven Shortcuts in Textfeldern.
- [ ] Viewport bleibt nutzbar.

## Import/Export zusätzlich

- [ ] Format-Support-Matrix aktualisiert.
- [ ] Fixtures synthetisch, keine privaten Kundendateien.
- [ ] Ungestützte Einheiten/Entities fail-closed.
- [ ] Keine falschen Support-Versprechen.
