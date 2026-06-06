# Icon, Brand & License Rules

Diese Datei ist streng. Sie schützt Hermes CAD vor rechtlichen und gestalterischen Problemen.

## Absolute Verbote

Hermes darf nicht verwenden:

- SketchUp Icons.
- SketchUp Logo.
- Trimble Logo.
- SketchUp Screenshots als UI-Grafik.
- Nachgezeichnete SketchUp Icons.
- Farb-/Formkombinationen, die wie SketchUp-Markenassets wirken.
- Fremde Icons ohne klare Lizenz.
- GitHub-Code ohne Lizenzprüfung.
- YouTube-Screenshots als eigene Assets.
- Kopierte Texte aus Dokumentationen.

## Erlaubt

Hermes darf:

- Workflows analysieren.
- Funktionen in eigenen Worten beschreiben.
- Eigene Icons bauen.
- Offene Icon-Sets verwenden, wenn Lizenz kompatibel ist.
- SVGs selbst erstellen.
- Inspirationsquellen dokumentieren.
- Ähnliche Funktionalität mit eigenem UI umsetzen.

## Icon-System Anforderungen

Speicherort:

`assets/icons/hermes/`

Dateiformat:

- SVG bevorzugt.
- Optional PNG exportiert.
- 16, 24, 32 px kompatibel.
- Dunkel-/Hellmodus kompatibel.

Stil:

- Einheitliche Linienstärke.
- Gleiche Ecken.
- Gleiche Perspektive.
- Keine überladenen Details.
- Aktiver Zustand klar.
- Deaktivierter Zustand klar.
- Hover/Pressed Zustand klar.

## Dokumentation pro Icon

Für jedes Icon:

```yaml
name:
file:
purpose:
created_by:
source:
license:
inspired_by:
notes:
```

Wenn selbst erstellt:

```yaml
source: self-created
license: Hermes CAD internal / project license
```

Wenn Open Source:

- Lizenzname.
- URL.
- Erlaubte Nutzung.
- Attribution notwendig ja/nein.
- Änderungsrecht ja/nein.

## UI Brand-Regel

Hermes CAD darf nicht aussehen wie ein SketchUp-Skin.

Hermes braucht:

- eigenes Logo
- eigene Primärfarbe
- eigene Panel-Optik
- eigene Toolbar-Abstände
- eigene Icon-Sprache
- eigene Mikrotexte
- eigene Dokumentation

## Namen

Im Produkt-UI nicht verwenden:

- „SketchUp Component“
- „SketchUp Dynamic Component“
- „3D Warehouse“ als eigener Dienstname
- „Extension Warehouse“ als eigener Dienstname

Erlaubt in interner Forschung/Dokumentation:

- „Referenz: SketchUp Components“
- „SketchUp-artiges Verhalten“
- „Kompatibilitätsanalyse“

## Quellen-Regel

Jede Quelle kommt in:

`docs/research/<feature>_research.md`

Jeder Asset-Lizenznachweis kommt in:

`docs/design/asset_licenses.md`
