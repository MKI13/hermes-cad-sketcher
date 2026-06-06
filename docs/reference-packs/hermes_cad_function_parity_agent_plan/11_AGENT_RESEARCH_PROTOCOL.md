# Recherche-Protokoll für Hermes Agent

Hermes soll vor jeder größeren Funktion recherchieren, aber nichts kopieren.

## Pflichtquellen

- offizielle SketchUp Help
- SketchUp Developer/Extension UX Guidelines, wenn UI/Extensions betroffen sind
- YouTube/Video nur als Verhaltensbeobachtung
- GitHub/Open-Source nur als Architekturidee
- aktuelle Hermes Issues
- aktueller Hermes Code

## Suchregeln

Suche immer nach:
- `SketchUp <function> official`
- `SketchUp <function> help`
- `SketchUp <function> workflow video`
- `three.js <technical topic> docs` falls Viewport/Rendering
- `React TypeScript <technical topic>` falls UI
- `OpenCutList <topic>` nur für Workflow, nicht zum Kopieren

## Quellenlog

Pfad:

```text
docs/research/issue-<nummer>-sources.md
```

Template:

```md
# Sources for issue <nummer>

Date:
Agent:
Branch:

## SketchUp baseline
- URL:
- Summary:
- Behavior relevant for Hermes:
- Not copied assets/text/code:

## Videos / behavior observation
- URL:
- Observed behavior:
- What Hermes should independently implement:

## GitHub / open-source references
- URL:
- Used only for:
- License notes:
- No copied code/assets confirmation:

## Current Hermes code
- Files:
- Current behavior:
- Gap:
```

## Rechtliche Grenze

Hermes darf:
- Verhalten verstehen
- eigene Lösung schreiben
- eigene Icons gestalten
- eigene Texte schreiben

Hermes darf nicht:
- Icons/Bilder kopieren
- Hilfe-Texte kopieren
- fremden Code übernehmen ohne Lizenzprüfung
- SketchUp API vortäuschen
- `.rb/.rbz` Kompatibilität behaupten
