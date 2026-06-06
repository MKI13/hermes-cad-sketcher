# SketchUp-Paritätsprüfung für jede Funktion

Hermes Agent muss nachweisen, dass eine Funktion das gewünschte SketchUp-ähnliche Verhalten wirklich trifft.

## Pflicht-Tabelle pro Funktion

| Punkt | Inhalt |
|---|---|
| Funktion | z. B. Push/Pull |
| SketchUp-Baseline | offizielles Verhalten aus Doku/Video |
| Hermes aktueller Stand | was funktioniert im Repo jetzt |
| Zielverhalten | was soll in dieser Issue fertig werden |
| Nicht-Ziel | was bleibt später |
| Tests | welche automatischen Tests beweisen es |
| UI-Beweis | Screenshot/Smoke/manuelle Schritte |
| Rollback | Commit/Tag |

## Beispiel Push/Pull

SketchUp-Baseline:
- Face klicken.
- Fläche wird hervorgehoben.
- Maus bewegt Extrusion.
- Measurement Box zeigt Distanz.
- Enter-Wert setzt Distanz.
- Push/Pull kann hinzufügen oder entfernen.

Hermes v0.3-Ziel:
- nur planare/axis-aligned oder definierte planare Faces, wenn Kernel noch begrenzt ist.
- keine falsche Behauptung beliebiger Solids.
- aktive Kontextregel.
- Live-Preview.
- Measurement Box.
- Undo/Redo.

## Beispiel Komponente

SketchUp-Baseline:
- Definition + Instanz.
- Definition bearbeiten wirkt auf alle Instanzen.
- Instanz-Transform wirkt nur auf Instanz.
- Make Unique trennt.

Hermes v0.3-Ziel:
- ComponentDefinition + ComponentInstance.
- Save/Load-Migration.
- Outliner-Anzeige.
- Make Unique.
- Tests.

## Recherche-Reihenfolge

1. Offizielle SketchUp Help / Developer Docs.
2. Offizielle oder seriöse Videos zur Bedienung.
3. GitHub/Open-Source nur für Architekturideen, nie zum Kopieren.
4. Bestehende Issues im Hermes Repo.
5. Bestehender Code.

## Quellenprotokoll

Jede Issue bekommt:

```text
docs/research/issue-<nummer>-sources.md
```

Mit:
- Datum
- URLs
- kurze Zusammenfassung
- was Hermes übernehmen darf
- was Hermes nicht kopieren darf
