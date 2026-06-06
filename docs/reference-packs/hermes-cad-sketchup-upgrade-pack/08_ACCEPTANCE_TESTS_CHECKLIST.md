# Acceptance Tests Checklist

Diese Checkliste muss Hermes bei jedem Release durchgehen.

## Component Basics

- [ ] Auswahl kann zu Komponente gemacht werden.
- [ ] Leere Auswahl zeigt freundlichen Hinweis.
- [ ] Name/Beschreibung können gesetzt werden.
- [ ] Lokaler Ursprung/Achsen werden gespeichert.
- [ ] Instanz wird im Modell erzeugt.
- [ ] Mehrere Instanzen zeigen auf dieselbe Definition.
- [ ] Bearbeiten einer Instanz aktualisiert alle Instanzen.
- [ ] Skalieren einer Instanz verändert nicht die Definition.
- [ ] Rotieren einer Instanz verändert nicht die Definition.
- [ ] Verschieben einer Instanz verändert nicht die Definition.
- [ ] Make Unique trennt eine Instanz.
- [ ] Explode funktioniert.
- [ ] Replace Component funktioniert.
- [ ] Save As funktioniert.
- [ ] Reload Definition funktioniert.
- [ ] Purge Unused funktioniert.

## Groups

- [ ] Auswahl kann zu Gruppe gemacht werden.
- [ ] Gruppe kann editiert werden.
- [ ] Gruppe kann kopiert werden.
- [ ] Gruppe kann explodiert werden.
- [ ] Gruppe kann in Komponente umgewandelt werden.
- [ ] Lock verhindert Bearbeitung.
- [ ] Hide blendet korrekt aus.

## Outliner

- [ ] Gruppen erscheinen.
- [ ] Komponenten erscheinen.
- [ ] Verschachtelte Elemente erscheinen.
- [ ] Expand/Collapse funktioniert.
- [ ] Suche funktioniert.
- [ ] Rename funktioniert.
- [ ] Drag & Drop funktioniert.
- [ ] Visibility Toggle funktioniert.
- [ ] Lock Toggle funktioniert.
- [ ] Klick im Outliner wählt im Viewport.
- [ ] Klick im Viewport wählt im Outliner.
- [ ] Große Modelle bleiben performant.

## Dynamic Components

- [ ] Attribute Panel öffnet für Dynamic Component.
- [ ] Options Panel zeigt Nutzerparameter.
- [ ] LenX/LenY/LenZ ändern Geometrie.
- [ ] X/Y/Z ändern Position.
- [ ] RotX/RotY/RotZ ändern Rotation.
- [ ] Hidden blendet Teile aus.
- [ ] Copies erzeugt Kopien.
- [ ] Formeln werden berechnet.
- [ ] Formelabhängigkeiten werden korrekt aktualisiert.
- [ ] Zyklusfehler werden erkannt.
- [ ] Ungültige Werte werden abgefangen.
- [ ] Undo/Redo funktioniert bei Parameteränderung.

## Cabinet/Korpus

- [ ] Breite/Höhe/Tiefe parametrierbar.
- [ ] Seitenstärke bleibt konstant.
- [ ] Boden/Deckel korrekt.
- [ ] Rückwand korrekt.
- [ ] Türen 0/1/2 funktionieren.
- [ ] Schubladen 0–8 funktionieren.
- [ ] Einlegeböden Anzahl/Abstand korrekt.
- [ ] Sockel/Füße optional.
- [ ] Griffe/Beschläge optional.
- [ ] Kanten-Metadaten vorhanden.
- [ ] BOM/Zuschnitt-Metadaten vorhanden.
- [ ] Make Unique für Cabinet funktioniert.

## UI/UX

- [ ] Statusleiste zeigt nächsten Schritt.
- [ ] Messfeld nimmt Werte an.
- [ ] Esc setzt Werkzeug zurück.
- [ ] Pre-selection funktioniert.
- [ ] Kontextmenü enthält passende Befehle.
- [ ] Aktives Werkzeug sichtbar.
- [ ] Fehlertexte freundlich.
- [ ] Deutsch/Englisch vorbereitet.

## Undo/Redo

- [ ] Jede Nutzeraktion ist ein Undo-Schritt.
- [ ] Keine Änderung beim Öffnen von Panels.
- [ ] Undo funktioniert nach Create Component.
- [ ] Undo funktioniert nach Make Unique.
- [ ] Undo funktioniert nach Dynamic Parameter Change.
- [ ] Redo funktioniert in gleicher Reihenfolge.

## Legal/Brand

- [ ] Keine SketchUp Icons.
- [ ] Keine SketchUp Logos.
- [ ] Keine kopierten Screenshots.
- [ ] Keine kopierten Hilfetexte.
- [ ] Alle Assets mit Lizenz dokumentiert.
- [ ] UI sieht eigenständig aus.
