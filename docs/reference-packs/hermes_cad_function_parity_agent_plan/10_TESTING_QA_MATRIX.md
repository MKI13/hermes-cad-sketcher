# Testing und QA Matrix

## Pflichtbefehle

```bash
npm ci
npm run test
npm run build
npm run check
```

Für Browser/UI:

```bash
npm run smoke:browser
```

Wenn Smoke nicht läuft:
- genaue Fehlermeldung dokumentieren
- fehlenden Browser/Dependency nennen
- manuelle Repro-Schritte angeben

## Testbereiche

| Bereich | Testtyp | Beispiele |
|---|---|---|
| Modellkern | Unit | create/move/rotate/delete/resize |
| Komponenten | Unit | definition/instance/make unique/explode |
| Active Context | Unit + UI | Auswahl innen/außen |
| Push/Pull | Unit + viewport | Face normal, distance, preview |
| Measurement Box | Unit | Parser, tool-aware application |
| Inference | Unit | endpoint/midpoint/on edge/axis lock |
| Viewport | DOM/smoke | click/select/draw/orbit |
| Import/Export | Unit fixtures | hcad/dxf/stl/glb später |
| Agent DSL | Unit | command parsing, fail-closed |
| Undo/Redo | Unit | command stack consistency |
| UI Panels | DOM | right tray, outliner, material panel |
| Icons | DOM/static | icon map contains known tools |
| Docs | static | README/AGENTS/changelog updated |

## Regression-Tests pro Feature

Jede neue Funktion muss mindestens einen Test enthalten, der künftig kaputtgeht, wenn die Funktion nur dekorativ bleibt.

Beispiel:
- Button existiert reicht nicht.
- Test muss Command/Model-State prüfen.

## Smoke-Szenarien

1. App lädt.
2. Linie zeichnen.
3. Rechteck zeichnen.
4. Box erstellen.
5. Auswahl anklicken.
6. Move.
7. Push/Pull.
8. Measurement Box Wert eingeben.
9. Komponente erstellen.
10. Make Unique.
11. Outliner wählt Objekt.
12. Save/Load roundtrip.
13. Undo/Redo.
14. Export nur getestete Formate.
