# OpenCutList-kompatible Komponentenregeln für Hermes CAD

Diese Notiz beschreibt, wie Hermes CAD Komponenten, Gruppen und reale Bauteile modellieren soll, damit spätere SketchUp/OpenCutList-Workflows für Möbelbau und Schreinerarbeit zuverlässig werden.

Referenz-Repository: <https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension>

Verifizierte Kurzbeschreibung des Upstream-Projekts: OpenCutList ist eine SketchUp-Erweiterung zur automatischen Erstellung von Stücklisten für Holzbau-/Woodworking-Projekte. Aktuelle offene Upstream-Themen berühren unter anderem Montageelemente/Bohrungen, DXF/CSV-Export, OCL Stretch Beta, Fitting Tools, Part Numbering, Cutting Diagram CSV, Grain Continuity und Druckvorlagen.

## 1. Grundprinzip

Ein echtes Bauteil soll in Hermes CAD als saubere Gruppe oder Komponente erkennbar sein.

Nicht gut:

```text
Lose Linien + lose Flächen + vermischte Körper
```

Besser:

```text
Korpus
 ├── Seitenwand_links
 ├── Seitenwand_rechts
 ├── Boden
 ├── Deckel
 ├── Rückwand
 ├── Tür_links
 └── Tür_rechts
```

Jedes reale Zuschnittteil braucht:

- eine eigene Gruppe oder Komponente,
- keine lose Geometrie als endgültiger Part,
- reale Maße im Inneren der Definition,
- saubere Außenform,
- echte Dicke,
- eindeutigen Namen,
- eindeutiges Material,
- nachvollziehbare lokale Achsen.

## 2. Definition und Instanz

SketchUp trennt:

- **Component Definition**: gemeinsamer Bauplan und gemeinsame Geometrie.
- **Component Instance**: eine eingesetzte Kopie dieser Definition mit eigener Position/Rotation/Skalierung.

Beispiel:

```text
Definition: Fachboden_600x560x19
Instanz 1: Fachboden unten
Instanz 2: Fachboden mitte
Instanz 3: Fachboden oben
```

Wenn die Definition geändert wird, ändern sich alle Instanzen. Das ist gewollt und wichtig für wiederholte Möbelteile.

## 3. Gruppe oder Komponente

- **Gruppe**: gut für ein Einzelteil, das nur einmal vorkommt.
- **Komponente**: besser für gleiche Teile, die mehrfach vorkommen.

Für Hermes CAD gilt: Wiederholte reale Teile sollen als gemeinsame Definition plus Instanzen modellierbar sein, nicht als unverbundene Kopien.

## 4. Make Unique

Wenn eine kopierte Komponente anders werden soll, muss sie eindeutig gemacht werden.

Beispiel:

```text
Fachboden_normal
Fachboden_normal
Fachboden_normal
```

Wenn nur der mittlere Fachboden einen Ausschnitt bekommt:

```text
Fachboden_normal
Fachboden_mit_Ausschnitt
Fachboden_normal
```

Hermes CAD braucht dafür eine `Make Unique`-Operation: eine Instanz bekommt eine neue Definition, bevor ihre innere Geometrie abweicht.

## 5. Lokale Achsen

Jede Komponente braucht lokale Achsen:

```text
Rot  = X
Grün = Y
Blau = Z
```

Für Plattenbauteile sollte Hermes CAD die Achsen explizit verwalten, damit Länge, Breite und Dicke eindeutig sind.

Empfehlung für Platten:

```text
X = Länge
Y = Breite
Z = Dicke
```

Eine spätere OpenCutList-Kompatibilitätsprüfung soll warnen, wenn die Dicke nicht plausibel aus den lokalen Achsen bestimmbar ist.

## 6. Skalieren von Komponenten

Riskant:

```text
Brett 1000 x 500 x 19 zeichnen
Komponente erstellen
Komponenteninstanz außen mit Scale-Werkzeug verziehen
```

Optisch kann das richtig aussehen, intern bleibt aber eine transformierte Instanz. Für Stücklisten ist das gefährlich.

Besser:

```text
Komponente öffnen
Geometrie innen auf echtes Maß ändern
Komponente schließen
```

Hermes CAD soll diese Trennung im Datenmodell abbilden: Instanz-Transform ist nicht dasselbe wie reale Definition-Geometrie.

## 7. Materialien und Maserichtung

Material gehört klar zum Teil oder zu den Flächen im Teil.

Beispiele:

```text
Seitenwand_links → Spanplatte weiß 19 mm
Rückwand → HDF 8 mm
Kante vorne → ABS weiß 2 mm
```

Nicht nur eine übergeordnete Baugruppe einfärben, wenn die Stückliste konkrete Teile auswerten soll.

Spätere Cut-list-Readiness-Warnungen sollen prüfen:

- fehlendes Material,
- uneindeutiges Material,
- fehlende Maserichtung bei Holzplatten,
- Material nur auf Assembly statt auf Part.

## 8. Verschachtelung

Verschachtelung ist nicht automatisch falsch:

```text
Schrank
 └── Korpus
     └── Seitenwand
         └── Lochreihe
```

Problematisch wird es, wenn ein reales Brett aus mehreren Untergruppen besteht:

```text
Seitenwand
 ├── Fläche_vorne
 ├── Fläche_hinten
 ├── Kante_links
 ├── Kante_rechts
 └── Bohrungskörper
```

Besser:

```text
Seitenwand = ein sauberer Solid-Körper
Bohrungen/Ausschnitte sauber modelliert oder separat logisch behandelt
```

Hermes CAD soll zwischen Assembly, Part, Hardware und Cutout unterscheiden können.

## 9. Dynamische Komponenten, Ausschnitte und Bohrungen

Dynamische Komponenten und verschachtelte Ausschnitte können bei Cutlists/Nesting problematisch sein, wenn die sichtbare Form nicht als sauberer Solid-Körper vorliegt.

Für Hermes CAD gilt:

- Ausschnitte und Bohrungen brauchen eindeutige Part-/Cutout-Semantik.
- Temporäre Hilfskörper dürfen nicht versehentlich als Zuschnittteile gezählt werden.
- Nesting-/Exportlogik darf nur saubere, reale Parts verwenden.

## 10. Empfohlenes Namensschema

Einfach:

```text
SW_L_720x560x19_Weiss
SW_R_720x560x19_Weiss
Boden_600x560x19_Weiss
Deckel_600x560x19_Weiss
Rueckwand_600x720x8_HDF
Tuer_L_716x297x19_Weiss
Tuer_R_716x297x19_Weiss
```

Mit Kategorie:

```text
PLT_Seitenwand_links_720x560x19
PLT_Boden_600x560x19
BAR_Leiste_vorne_600x40x20
HW_Scharnier_110Grad
CUT_Ausschnitt_Spuele
ASM_Schrank_Korpus
```

Präfixe:

```text
PLT = Platte
BAR = Leiste/Stab
HW  = Hardware/Beschlag
CUT = Ausschnitt/Bohrung
ASM = Assembly/Baugruppe
```

## 11. Cut-list-Readiness-Checks

Hermes CAD sollte eine Modellprüfung anbieten, die warnt bei:

- loser Geometrie,
- nicht gruppierten realen Bauteilen,
- nicht-soliden Parts,
- skalierten Komponenteninstanzen,
- fehlendem Material,
- falschen oder unbekannten lokalen Achsen,
- verschachtelter Geometrie, die ein Brett in Untergruppen zerlegt,
- dynamischen Cutout-/Bohrungsstrukturen ohne sauberen Solid,
- versteckter Geometrie innerhalb von Parts,
- unklarer Maserichtung,
- Beschlägen, die als Zuschnittteile gezählt würden.

## 12. Issue-Vorlage für Komponentenerkennung / Cutlist

```md
## Title
Incorrect component recognition / dimensions when creating SketchUp components for OpenCutList-style cut lists

## Environment
- Hermes CAD version / branch:
- Export target: SketchUp / OpenCutList / internal cut list
- Operating system:
- Model type: woodworking / cabinet / furniture
- File attached: yes / no

## Description
The model is built from woodworking parts such as side panels, shelves, doors, backs, rails and fittings. Each real part is intended to be represented as a component or group.

Depending on how the component is created, copied, scaled, nested or made unique, the cut list may interpret the part differently.

## Expected behavior
The cut list should identify each real woodworking part as a separate part and calculate correct length, width, thickness, quantity, material, grain direction, and nesting result.

## Steps to reproduce
1. Draw a rectangular board.
2. Make it a component.
3. Copy the component several times.
4. Scale or modify one instance.
5. Optionally use Make Unique on one instance.
6. Add material and grain direction.
7. Generate the cut list.
8. Compare with expected real woodworking parts.
```

## 13. Related Hermes CAD issues

- #26: component instances with transforms.
- #46: groups/components edit boundaries.
- #47: moving loose edges/faces with topology-safe stretch rules.
- #48: active face context for Push/Pull.
- #52: OpenCutList readiness validator.
- #53: Make Unique and local axes semantics.

## 14. Stop rules

- Do not claim direct OpenCutList compatibility until export/import behavior is tested.
- Do not post to the upstream OpenCutList repository without explicit approval.
- Keep Hermes CAD model semantics honest: own data model first, SketchUp/OpenCutList export later.
