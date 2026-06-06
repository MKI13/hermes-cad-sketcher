# UI/UX-Regeln für Hermes CAD

## Hauptregel

Die UI darf SketchUp-ähnlich vertraut sein, aber nicht kopiert.

## Keine Deko-Regel

Ein sichtbares UI-Element muss einen Status haben:

| Status | Bedeutung |
|---|---|
| ready | Funktion ist umgesetzt, getestet, dokumentiert |
| experimental | Funktion arbeitet teilweise, Grenzen sind sichtbar |
| planned | Funktion ist geplant, aber deaktiviert oder klar markiert |

Verboten:
- aktiver Button ohne echte Funktion
- Panel mit Werten, die nicht aus dem Modell kommen
- Menüpunkt, der nichts macht
- falsche Erfolgsmeldungen
- „Import unterstützt“, obwohl nur Teilformat existiert

## Layout-Prinzip

- Viewport hat Priorität.
- Top-Menü für Hauptbereiche.
- linke Icon-Leiste für schnelle Werkzeuge.
- rechter Tray für Inspector, Outliner, Tags, Materials, Scenes, Styles, Agent.
- Floating Windows nur optional und verschiebbar/minimierbar/skalierbar.
- Statusbar unten für Werkzeug, Auswahl, Maß, Einheit, Hinweise.
- Measurement Box unten rechts immer sichtbar, wenn Werkzeug aktiv ist.

## Tool Feedback

Jedes Werkzeug braucht:

- Cursor-Status
- Statusbar-Hinweis
- Hover/Preview
- Snap-Cue falls relevant
- Esc-Abbruch
- Undo-Eintrag
- Fehlertext bei ungültiger Aktion

## Beispiel: Push/Pull UI

Ready erst, wenn:

- Face Hover funktioniert.
- Face Klick wählt Face.
- Preview bewegt Face in Normalenrichtung.
- Measurement Box zeigt Distanz.
- Wert-Eingabe übernimmt Distanz.
- `Esc` bricht ab.
- Aktion erzeugt Command.
- Undo/Redo funktioniert.
- Save/Load erhält Ergebnis.
- Test vorhanden.

## Beispiel: Component UI

Ready erst, wenn:

- Auswahl in Komponente umgewandelt wird.
- Definition/Instanz getrennt sind.
- Outliner zeigt Definition/Instanz sinnvoll.
- Doppelklick öffnet Kontext.
- Breadcrumb zeigt Kontext.
- Make Unique funktioniert.
- Instanz-Transform ändert nicht Definition.
- Tests vorhanden.

## Rechtliche UI-Regeln

Nicht kopieren:
- SketchUp Toolbar-Icons
- Trimble/SketchUp Logos
- exakte Farbcodierung geschützter UI-Elemente
- Hilfe-Texte oder Tooltip-Texte 1:1

Erlaubt:
- eigene einfache Linienicons
- Lucide als Basis, sofern Lizenz beachtet wird
- eigene Hermes-CAD Icon-Sprache
- vertraute CAD-Begriffe wie Linie, Rechteck, Push/Pull, Komponente, Outliner
