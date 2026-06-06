# Release Notes — Rendering Agent Logic Pack — 2026-06-06

## Branch

`feature/rendering-agent-logic-20260606-185749`

## Quelle

Referenzpaket: `docs/reference-packs/hermes_cad_rendering_agent_logic_pack/`

## Inhalt dieses Slices

- Render-Architekturpaket im Repository abgelegt.
- `RenderSceneSnapshot` als separate Render-Schicht eingeführt.
- PBR-kompatible Materialdefinitionen mit Validierung eingeführt.
- Sichere Renderjob-Struktur für interne Vorschau und spätere lokale Blender-Bridge eingeführt.
- Fail-closed Render-Chat-Kommandos eingeführt.
- Rechter Tray zeigt einen internen `Render-Workspace` mit Snapshot-Status.
- Research-Log und ADR ergänzt.

## Nicht enthalten

- Noch keine echte Blender-Bridge.
- Noch kein finaler Fotorealismus-Renderer.
- Keine SKP-/DWG-/Ruby-Plugin-Kompatibilität.
- Keine SketchUp-/Trimble-Assets.

## Rollback

Checkpoint vor diesem Paket:

- Commit: `fb6d3e8923deb5864b81d8cf202a86ddafec485c`
- Tag: `rollback/pre-rendering-agent-logic-20260606-185749`

Rollback auf newpc:

```bash
cd ~/hermes-cad-sketcher
git switch feature/rendering-agent-logic-20260606-185749
git reset --hard fb6d3e8923deb5864b81d8cf202a86ddafec485c
git clean -fd
systemctl --user restart hermes-cad-sketcher.service
```

## Verifikation

Nach Integration ausführen:

```bash
npm run test -- tests/rendering.test.ts tests/renderCommands.test.ts tests/renderWorkspacePanel.test.tsx tests/rightTray.test.tsx
npm run check
npm run build
systemctl --user restart hermes-cad-sketcher.service
curl -I http://127.0.0.1:5173/
curl -I http://192.168.178.27:5173/
```
