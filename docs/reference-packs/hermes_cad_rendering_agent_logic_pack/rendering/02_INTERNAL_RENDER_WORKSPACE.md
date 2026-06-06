# Interner Render Workspace im Hermes CAD Fenster

## Ziel

Der Nutzer soll im gleichen Hermes CAD Fenster vom Arbeitsmodus in den Render-Modus wechseln können.

## UI-Struktur

Rechter Hermes Tray:

- Render
  - Qualität: Draft / Preview / Final
  - Kamera: aktuelle Ansicht speichern, Kamera wählen
  - Licht: Sonne, Studio, Area Light
  - Umgebung: Farbe/HDRI/Studio
  - Materialien: Auswahl, Kategorie, Textur, Maserung
  - Vorschau: schnell rendern
  - Final: lokale Render-Bridge starten

## Workflow

1. Modell zeichnen.
2. Komponenten sauber benennen.
3. Materialien zuweisen.
4. Render Workspace öffnen.
5. Kamera aus aktueller Ansicht speichern.
6. Licht-Preset wählen.
7. Draft Preview prüfen.
8. Optional Final Render über Bridge starten.

## UI-Regeln

- Render Workspace darf nicht die CAD-Arbeitsfläche blockieren.
- Keine SketchUp-Icons verwenden.
- Eigene Hermes Icons oder lucide-react Icons verwenden, wenn Lizenz passt.
- Rendering-Einstellungen müssen verständlich bleiben: nicht zu viele Profi-Regler am Anfang.
- Für Marios zuerst praktische Presets statt Shader-Fachbegriffe.
