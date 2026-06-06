# Beste Lösung für realistisches Rendering in Hermes CAD

## Entscheidung

Hermes soll **eine Render-Erweiterung innerhalb von Hermes CAD** bauen und zusätzlich **eine optionale lokale Render-Bridge** vorbereiten.

Nicht empfohlen als erster Schritt:

- Nur Text im Hermes Chat generieren und hoffen, dass daraus Rendering entsteht.
- Sofort ein komplett zweites Live-Programm bauen.
- Rendering direkt in den CAD-Kern einbauen.

## Zielarchitektur

```text
Hermes CAD Main App
├── CAD Workspace
│   ├── Zeichnen
│   ├── Push/Pull
│   ├── Komponenten
│   ├── Outliner
│   └── Maße
│
├── Render Workspace
│   ├── Material Editor
│   ├── Lighting Panel
│   ├── Camera Panel
│   ├── Environment/HDRI Panel
│   ├── Preview Quality
│   └── Render Button
│
├── Hermes Agent Chat
│   ├── CAD Commands
│   ├── Render Commands
│   └── Safe JSON actions
│
└── Optional Local Render Bridge
    ├── Blender/Cycles still render
    ├── EEVEE preview render
    ├── GLB/glTF export/import
    └── PNG result back to Hermes CAD
```

## Warum diese Lösung die beste ist

### 1. Ein Hauptprogramm bleibt einfach für Marios

Marios arbeitet weiter in Hermes CAD. Er muss nicht zwischen vielen Programmen wechseln, um ein Möbelstück zu zeichnen und realistisch anzuschauen.

### 2. Der Render-Workspace kann live sein

Mit Three.js kann Hermes im Browser schon direkte Vorschau zeigen: Materialien, Schatten, Licht, Kamera, Umgebung. Das ist schnell genug für Arbeit.

### 3. Hochwertige Bilder brauchen eine Bridge

Fotorealistische Finalbilder brauchen oft Path Tracing, bessere Schatten, Texturen und Sampling. Das soll eine lokale Bridge machen, z. B. Blender/Cycles. Die Bridge ist optional und verändert nicht das CAD-Modell.

### 4. Chat bleibt nützlich, aber kontrolliert

Hermes Chat soll Renderjobs vorbereiten:

- "Mach die Front weiß lackiert."
- "Setze warmes Licht von links."
- "Erstelle eine realistische Küchenrendering-Vorschau."
- "Render Final in 1920x1080."

Aber intern muss daraus ein sicheres JSON-Kommando werden, kein freier JavaScript/Ruby-Code.

## Späteres zweites Programm

Ein zweites Programm ist erst sinnvoll, wenn:

- das Modell sehr groß wird,
- Rendering zu langsam im CAD-Fenster wird,
- ein anderer Renderer dauerhaft parallel laufen soll,
- mehrere Monitore/Arbeitsplätze benutzt werden,
- echte RTX/Path-Tracing-Live-Ansicht gewünscht wird.

Dann soll es heißen: `Hermes Render Viewer`. Es bekommt nur Snapshot-/Eventdaten und darf keine eigene CAD-Wahrheit erzeugen.
