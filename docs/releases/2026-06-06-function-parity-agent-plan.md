# Release Notes — Function-Parity-Agent-Plan — 2026-06-06

## Branch

`feature/function-parity-agent-plan-20260606-193816`

## Quelle

Referenzpaket: `docs/reference-packs/hermes_cad_function_parity_agent_plan/`

## Inhalt dieses Slices

- Function-Parity-Agent-Plan im Repository abgelegt.
- `AGENTS.md` um die Function-Parity-Regel ergänzt.
- `CHANGELOG.md` eingeführt.
- Workbench-Funktionsstatus von `ready | planned` auf `ready | experimental | planned` erweitert.
- Workbench-Status einiger teilweise vorhandener, aber nicht vollständig direkt ausführbarer Funktionen auf `experimental` gesetzt.
- Regressionstests ergänzt:
  - `tests/workbenchLayout.test.ts`
  - `tests/contributingDocs.test.ts`

## Nicht enthalten

- Kein Geometry-Kernel-Wechsel.
- Kein Command-Architektur-Rewrite.
- Keine neue Dateiformat-Unterstützung.
- Keine Änderung an `main`.

## Rollback

Checkpoint vor diesem Paket:

- Commit: `899d6affa0594670dea49dbaee05f7959fdae542`
- Tag: `rollback/pre-function-parity-agent-plan-20260606-193816`

Rollback auf newpc:

```bash
cd ~/hermes-cad-sketcher
git switch feature/function-parity-agent-plan-20260606-193816
git reset --hard 899d6affa0594670dea49dbaee05f7959fdae542
git clean -fd
systemctl --user restart hermes-cad-sketcher.service
```

## Verifikation

Nach Integration ausführen:

```bash
npm run test -- tests/workbenchLayout.test.ts tests/contributingDocs.test.ts
npm run check
systemctl --user restart hermes-cad-sketcher.service
curl http://192.168.178.27:5173/
```
