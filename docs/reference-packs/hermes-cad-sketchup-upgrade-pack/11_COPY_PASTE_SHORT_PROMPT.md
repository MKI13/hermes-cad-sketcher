# Kurzer Copy-Paste Prompt für Hermes

Hermes, verbessere Hermes CAD mit Fokus auf SketchUp-artige Komponenten, dynamische Komponenten und Benutzeroberfläche.

Baue Hermes CAD nicht als Kopie, sondern als eigenständiges Schreiner-CAD mit ähnlicher einfacher Bedienlogik:

- Komponenten aus Auswahl erstellen.
- ComponentDefinition und ComponentInstance sauber trennen.
- Änderungen an Definition aktualisieren alle Instanzen.
- Make Unique für einzelne Instanzen.
- Edit in Context mit Breadcrumbs.
- Outliner mit Gruppen/Komponenten-Hierarchie, Suche, Sichtbarkeit, Lock, Rename, Drag & Drop.
- Component Browser/Bibliothek.
- Dynamic Components mit Parametern, Formeln, Dropdowns, Hidden, Copies, X/Y/Z, LenX/LenY/LenZ, RotX/RotY/RotZ.
- Parametrische Korpus-/Schrank-/Küchen-Komponenten mit Breite/Höhe/Tiefe, Materialstärke, Türen, Schubladen, Böden, Rückwand, Sockel, Kanten, Beschlägen und BOM/Zuschnitt-Metadaten.
- UI mit Toolbar, Panels, Entity Info, Dynamic Options, Statusleiste, Messfeld, Kontextmenü, Shortcuts, Inferenz-Lock und Undo/Redo.

Pflicht: Bevor du eine Funktion/Erweiterung baust, recherchiere im Web: offizielle SketchUp-Dokumentation, YouTube, Google, GitHub, Foren und bestehende Plugins. Dokumentiere Quellen und Verhalten in `docs/research/<feature>_research.md`.

Verbot: keine SketchUp Icons, Logos, Screenshots, kopierten Hilfetexte oder proprietären Codes verwenden. Baue eigene Hermes Icons und eigenes UI-Design. Verhalten verstehen und eigenständig umsetzen.

Arbeite in kleinen Schritten: Audit → Datenmodell → Commands → UI → Tests → Dokumentation → Abnahme.
