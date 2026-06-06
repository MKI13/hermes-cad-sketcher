# Hermes CAD – SketchUp-artige Komponenten & UI Upgrade Pack

Erstellt: 2026-06-06

Dieses Paket enthält fertige Prompts, Agent-Regeln, Spezifikationen, Issue-Vorlagen und Abnahmetests für Hermes, damit Hermes CAD die Arbeitslogik von SketchUp **funktional** nachbildet, aber mit eigener Marke, eigener UI-Sprache und eigenen Icons.

## Ziel

Hermes CAD soll sich beim Modellieren intuitiv und schnell anfühlen:

- Komponenten aus Auswahl erstellen.
- Gruppen und Komponenten sauber trennen.
- Komponenten-Definitionen und Instanzen wie in SketchUp verstehen.
- Alle Instanzen einer Definition synchron bearbeiten.
- Einzelne Instanzen mit „Make Unique“ abkoppeln.
- Verschachtelte Komponenten/Gruppen im Outliner verwalten.
- Parametrische/dynamische Komponenten für Schränke, Küchen, Kleiderschränke und Korpusse erstellen.
- Statusleiste, Messfeld, Achsen-Snapping, Inferenz-Lock und Undo/Redo professionell umsetzen.
- Bestehende Funktionen vor jeder neuen Erweiterung im Web recherchieren und 1:1 im Verhalten weiterbauen, aber keine fremden Icons, Logos, Texte, Bilder oder geschützten Assets kopieren.

## Wichtige Dateien

1. `00_MASTER_PROMPT_FOR_HERMES.md`  
   Der Hauptprompt, den du direkt an Hermes geben kannst.

2. `01_AGENT_OPERATING_RULES.md`  
   Dauerhafte Arbeitsregeln für Hermes Agent.

3. `02_WEB_RESEARCH_PROTOCOL.md`  
   Pflichtregel: Vor jeder Funktion Web-Recherche auf offiziellen Dokumentationen, YouTube, Google, GitHub, Foren und bestehenden Plugins.

4. `03_COMPONENTS_SKETCHUP_PARITY_SPEC.md`  
   Vollständige Spezifikation für Komponenten-Logik.

5. `04_DYNAMIC_COMPONENTS_CABINET_SPEC.md`  
   Parametrische Komponenten für Küchen, Schränke, Kleiderschränke, Korpusse.

6. `05_UI_UX_SKETCHUP_LIKE_BUT_ORIGINAL.md`  
   UI/UX-Vorgaben: SketchUp-ähnlicher Workflow, aber eigene Gestaltung.

7. `06_ICON_BRAND_AND_LICENSE_RULES.md`  
   Strenge Regel: keine SketchUp Icons, Logos, Screenshots, Marken-Assets oder kopierte UI-Grafiken.

8. `07_IMPLEMENTATION_ROADMAP.md`  
   Reihenfolge der Umsetzung.

9. `08_ACCEPTANCE_TESTS_CHECKLIST.md`  
   Tests, wann die Funktion wirklich fertig ist.

10. `09_github_issue_templates/`  
   Fertige Issue-Vorlagen für Repository.

11. `10_HERMES_AGENT_MEMORY_RULES.md`  
   Regeln, die Hermes dauerhaft in Memory/Projektregeln übernehmen soll.

12. `hermes_agent_config.yaml`  
   Strukturierte Agent-Konfiguration.

13. `source_log_template.md`  
   Vorlage für Recherchequellen je Feature.

## Offizielle Referenzquellen, die Hermes immer zuerst prüfen soll

- SketchUp Help Center – Components  
  https://help.sketchup.com/en/sketchup/components

- SketchUp Help Center – Making a Dynamic Component  
  https://help.sketchup.com/en/sketchup/making-dynamic-component

- SketchUp Help Center – Dynamic Component Predefined Attributes  
  https://help.sketchup.com/en/sketchup/dynamic-component-predefined-attributes

- SketchUp Help Center – Hierarchies in the Outliner  
  https://help.sketchup.com/en/sketchup/working-hierarchies-outliner

- SketchUp Extension UX Guidelines  
  https://sketchup.github.io/sketchup-extension-ux-guidelines/

- SketchUp Developer Center / Extension Warehouse  
  https://developer.sketchup.com/ew

Diese Quellen dienen als Verhaltens- und UX-Referenz. Hermes darf daraus keine geschützten Assets kopieren.
