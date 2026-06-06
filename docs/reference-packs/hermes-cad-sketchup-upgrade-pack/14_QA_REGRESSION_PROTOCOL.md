# QA & Regression Protocol

## Vor jedem Merge

Hermes muss prüfen:

1. Build läuft.
2. Unit Tests laufen.
3. UI Tests laufen, falls vorhanden.
4. Keine Type Errors.
5. Keine Lint Errors.
6. Keine neuen Lizenzprobleme.
7. Keine fremden Assets.
8. Undo/Redo Tests.
9. Performance Smoke Test.

## Manuelle Schreiner-Szenarien

### Szenario A – Ein Schrank aus Komponenten

1. Rechteck/Korpus modellieren.
2. Seiten/Böden gruppieren.
3. Alles zu Komponente machen.
4. Komponente kopieren.
5. Eine Instanz editieren.
6. Prüfen: beide ändern sich.
7. Eine Instanz Make Unique.
8. Unique Instanz ändern.
9. Prüfen: andere bleibt unverändert.

### Szenario B – Küche mit mehreren Unterschränken

1. Cabinet Preset einfügen.
2. Breite ändern.
3. 5 Instanzen nebeneinander setzen.
4. Ein Modul unique machen.
5. Türen/Schubladen variieren.
6. BOM-Metadaten prüfen.

### Szenario C – Outliner Organisation

1. Mehrere Räume/Schränke verschachteln.
2. Namen vergeben.
3. Suchen.
4. Sichtbarkeit toggeln.
5. Lock toggeln.
6. Drag & Drop in andere Gruppe.
7. Undo/Redo prüfen.

### Szenario D – Dynamic Fehler

1. Ungültige Formel eintragen.
2. Zyklus erzeugen.
3. Negative Breite setzen.
4. Zu große Materialstärke setzen.
5. Prüfen: freundliche Meldung, Modell bleibt stabil.

## Performance Tests

- 1.000 ComponentInstances.
- 10.000 Outliner Nodes.
- 100 Dynamic Cabinets.
- 20 verschachtelte Ebenen.
- 100 Undo-Schritte.

## Release Report Vorlage

```md
# Release QA Report

Version:
Datum:

## Tests bestanden
- 

## Tests fehlgeschlagen
- 

## Performance
- 

## Lizenzprüfung
- 

## Offene Risiken
- 

## Freigabe
- [ ] Ja
- [ ] Nein
```
