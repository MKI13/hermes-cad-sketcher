# Issue: Komponenten als Definition/Instanz für Rendering und Möbelbau verbessern

## Ziel

Komponenten sollen nicht nur Gruppen mit Entity-IDs sein. Sie sollen langfristig wie echte Definitionen und Instanzen funktionieren.

## Warum wichtig für Rendering

- Instanzen können effizient gerendert werden.
- Gleiche Bauteile brauchen nur eine Geometriequelle.
- Material-/Transform-Vererbung wird sauberer.
- Make Unique wird möglich.

## Aufgaben

- Konzept `ComponentDefinition` und `ComponentInstance` planen.
- Bestehende Komponenten migrieren oder Adapter schreiben.
- `Make Unique` planen.
- Verschachtelte Komponenten vorbereiten.
- RenderSnapshot muss Instanzen erkennen.

## Acceptance Criteria

- Bestehende Projekte gehen nicht kaputt.
- Komponenten können dupliziert werden, ohne semantische IDs zu verlieren.
- RenderSnapshot erhält Instanzinformationen.
- Tests für Migration/Kompatibilität.
- `npm run check` grün.
