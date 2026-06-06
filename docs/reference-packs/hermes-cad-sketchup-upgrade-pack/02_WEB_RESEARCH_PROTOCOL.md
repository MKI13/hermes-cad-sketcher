# Web Research Protocol für Hermes CAD

Hermes muss vor jeder größeren Funktion oder Erweiterung Web-Recherche durchführen.

## Warum?

Hermes CAD soll bekannte und bewährte CAD-Workflows verstehen, besonders SketchUp-artige Funktionen. Hermes soll nicht raten, sondern die echte Bedienlogik aus Dokumentationen, Videos, Tutorials, GitHub und Foren ableiten.

## Mindestquellen pro Feature

Für jedes Feature:

1. Offizielle Dokumentation  
   Mindestens 1–3 offizielle Quellen, bevorzugt Herstellerdokumentation.

2. YouTube  
   Mindestens 2 Videos, in denen echte Nutzung gezeigt wird. Hermes soll nicht nur Titel lesen, sondern Workflows aus Beschreibung/Transkript/Screenshots ableiten, wenn verfügbar.

3. Google/Web Tutorials  
   Mindestens 2 Artikel oder Tutorials.

4. GitHub  
   Mindestens 2 relevante Repos oder Codebeispiele, falls vorhanden.  
   Nur verwenden, wenn Lizenz kompatibel ist. Sonst nur als Inspiration/Verhaltensanalyse.

5. Foren/Community  
   Mindestens 2 Beiträge zu Nutzerproblemen, Bugs, Erwartungen oder Workarounds.

6. Plugin-/Extension-Analyse  
   Wenn passend: ähnliche Erweiterungen prüfen, z. B. Komponentenbibliotheken, Cabinet-Tools, Cutlist-Tools, Parametric-Modeling-Tools.

## Pflichtdatei

Für jedes Feature anlegen:

`docs/research/<feature-name>_research.md`

Vorlage:

```md
# Research: <Feature Name>

Datum:
Bearbeiter: Hermes

## Ziel
Was soll Hermes CAD können?

## Quellen

### Offizielle Dokumentation
- URL:
  - Erkenntnis:
  - Relevanz:

### YouTube
- URL:
  - Beobachteter Workflow:
  - Relevanz:

### GitHub/Open Source
- URL:
  - Lizenz:
  - Nutzbar:
  - Nur Inspiration:
  - Risiko:

### Foren/Community
- URL:
  - Nutzerproblem:
  - Erwartetes Verhalten:

## Verhaltenszusammenfassung
Wie soll sich die Funktion für den Nutzer anfühlen?

## Hermes CAD Gap Analyse
Was existiert schon?
Was fehlt?

## Nicht kopieren
Welche Assets/Texte/Icons/Code dürfen nicht übernommen werden?

## Umsetzung
Architektur:
UI:
Tests:
Risiken:
```

## Spezielle Recherchefragen für SketchUp-artige Funktionen

Bei Komponenten:

- Was ist Definition?
- Was ist Instanz?
- Was passiert beim Bearbeiten?
- Was passiert beim Skalieren einer Instanz?
- Was macht Make Unique?
- Wie funktioniert Explode?
- Wie werden Komponenten gespeichert?
- Wie werden Komponenten ersetzt?
- Wie funktioniert der Outliner?

Bei dynamischen Komponenten:

- Welche Attribute gibt es?
- Wie funktionieren Formeln?
- Wie funktionieren Dropdowns?
- Wie funktionieren Kopien?
- Wie funktionieren Aktionen/Interaktionen?
- Wie werden verschachtelte Unterkomponenten gesteuert?
- Wie werden Fehler in Formeln angezeigt?

Bei UI:

- Wo findet der Nutzer den Befehl?
- Gibt es Toolbar, Menü, Kontextmenü, Shortcut?
- Was zeigt die Statusleiste?
- Was zeigt das Messfeld?
- Wie wird Undo behandelt?
- Wie reagiert Esc?
- Wie funktioniert Pre-Selection?

## Qualitätskriterium

Keine Implementierung darf als „fertig“ markiert werden, solange die Recherche-Datei fehlt.
