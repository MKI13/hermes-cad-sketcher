# Tech-Stack-Entscheidung: Ist die Codesprache richtig?

## Antwort

Ja. Für den aktuellen Stand ist die Code-Sprache und Architektur grundsätzlich richtig:

- **TypeScript** für CAD-Kernmodell, Befehle, Projektdateien, UI-Logik und Tests.
- **React** für die Bedienoberfläche.
- **Vite** für schnelle lokale Entwicklung und Build.
- **Three.js** für den interaktiven 3D-Viewport.
- **Python Bridge** für lokalen Agentenzugriff und spätere lokale Render-/System-Integration.

## Warum nicht sofort C++/Rust/Native?

Hermes CAD ist noch im schnellen Produktaufbau. Die größten Lücken sind Workflow, Komponenten, UI, Outliner, Materiallogik, Agent-Integration und Render-Architektur. Diese lassen sich im vorhandenen Stack schneller und sauberer bauen als mit einem kompletten Native-Neustart.

## Wann später Rust/C++/WASM sinnvoll wird

Später kann ein zusätzlicher Geometrie-Kernel sinnvoll werden, wenn Hermes braucht:

- Boolesche Operationen auf komplexen Solids.
- Fillets, Fasen, Rundungen, NURBS/BREP.
- STEP/IFC mit echten Topologien.
- große Modelle mit vielen Bauteilen.
- stabile Mesh-Generierung für Rendering und CNC.

Dann soll Hermes nicht alles neu schreiben, sondern einen getrennten Kernel-Adapter planen:

```text
React UI + Three.js Viewport
        |
TypeScript CAD Domain Model
        |
Geometry Kernel Adapter Interface
        |--- Current TS box/face/edge kernel
        |--- Future WASM kernel
        |--- Future external converter bridge
```

## Grundregel

Nicht die Sprache wechseln, bevor die Modellarchitektur stabil ist. Erst Komponenten, Szenen, Materialien, Render-Snapshot und Tests sauber machen. Danach kann ein Kernel gezielt ersetzt oder ergänzt werden.
