# Hermes CAD Clear Icons

Ein eigenes, klares SVG-Icon-Paket für **Hermes CAD Sketcher**.

## Inhalt

- 76 originale CAD/UI SVG-Icons
- jeweils als `svg/color/*.svg` und `svg/mono/*.svg`
- `icon-map.json` mit ID, Kategorie, deutschem Label und Tags
- `react/HermesIcon.tsx` als einfache React-Integration
- `preview-sheet.svg` und `preview.html` zur schnellen Kontrolle
- MIT-Lizenz

## Ziel

Die Icons sind bewusst **SketchUp-ähnlich im Funktionsumfang**, aber **nicht kopiert**:
keine Trimble-/SketchUp-Logos, keine geschützten Original-Icons, kein 1:1 Layout.

Die neuen Icons sind deutlicher als die erste Version:

- 48×48 ViewBox statt sehr kleiner Details
- stärkere Linien
- einfache erkennbare Symbole
- Farbkategorien für Funktionen
- Vorschau mit deutschem Namen

## Kategorien

- `drawing`: Zeichnen
- `modeling`: Modellieren
- `measure`: Messen / Snapping / Maßeingabe
- `camera`: Kamera / Navigation
- `structure`: Komponenten / Outliner / Tags
- `visual`: Materialien / Styles / Schatten
- `files`: Import / Export / Projektdateien
- `agent`: Hermes Agent / Konsole / Bridge
- `system`: Undo / Redo / Einstellungen / Hilfe

## Nutzung in Hermes CAD

Empfohlen:

```text
public/icons/hermes-cad-clear-icons/svg/mono/*.svg
public/icons/hermes-cad-clear-icons/svg/color/*.svg
src/ui/HermesIcon.tsx
```

Dann in React:

```tsx
<HermesIcon id="push-pull-clear" size={24} />
<HermesIcon id="rectangle-tool-clear" variant="color" size={32} />
```

## Lizenz

MIT License. Siehe `LICENSE`.

