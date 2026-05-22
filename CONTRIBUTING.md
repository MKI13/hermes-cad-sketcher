# Contributing to Hermes CAD Sketcher

This repository is a measured CAD sketcher, not a playground for unverified code. Contributions from humans and Agenten are welcome when they keep the product stable, testable, and honest about CAD/file-format scope.

Authoritative project rules live in `AGENTS.md`. If this file and `AGENTS.md` disagree, follow `AGENTS.md`.

## Quick start

```bash
npm ci
npm run dev
```

Before any commit or pull request:

```bash
npm run check
```

For UI-facing changes, also run the production browser smoke when available:

```bash
npm run build
npm run smoke:browser
```

`npm run check` runs the Vitest suite and the production build. Do not push code that fails it.

## Branch and PR workflow

- Use the active development branch for normal product work: `dev/v0.2`.
- Do not push directly to `main`.
- Keep each PR focused on one feature, fix, documentation update, or verification slice.
- PRs should state:
  - what changed;
  - which files/formats are affected;
  - tests added or changed;
  - exact verification commands and results;
  - known limits or CAD risks.

## Agent-friendly workflow

Agenten should work from issues or a clearly scoped task. Good issues include:

- Ziel / goal;
- Scope and non-goals;
- Acceptance Criteria;
- Verification commands;
- CAD-/Dateiformat-Grenzen;
- whether browser smoke or independent review is required.

When multiple agents work together, use Issues for coordination instead of silently stacking unrelated changes. If a task is blocked by product decisions, file-format uncertainty, browser QA, or review feedback, open or update an Issue with the blocker and the exact evidence.

## CAD and file-format honesty

- Millimeter remain the base unit. Any new model operation must preserve Millimeter semantics.
- Keine native DWG- oder SKP-Unterstützung behaupten unless a real bridge/adapter and validation path exists.
- Keine SketchUp-Ruby-Plugin-Kompatibilität (`.rb`, `.rbz`) behaupten.
- Do not claim full DXF/STL/STEP/IFC support when only a subset is implemented.
- Importers must fail closed: unsupported or malformed CAD semantics should be rejected/skipped with clear status instead of being repaired into simpler geometry.
- Never overwrite original user files during import/export work.

## Testing expectations

Use TDD for behavior changes:

1. Write a failing test first.
2. Run the focused test and confirm RED.
3. Implement the smallest change.
4. Re-run focused tests.
5. Run `npm run check`.
6. For UI/browser changes, run `npm run smoke:browser` after `npm run build`.

Useful test locations:

- `tests/model.test.ts` for core model behavior.
- `tests/export.test.ts` for CAD import/export boundaries.
- `tests/*Panel.test.tsx` for small React panels.
- `tests/smokeBrowserContract.test.ts` and `scripts/smoke-browser.mjs` for browser smoke coverage.

## Privacy and fixtures

- Keine echten Kunden- oder privaten Dateien in Issues, tests, fixtures, commits, screenshots, or PRs.
- Use synthetic or anonymized CAD/project files under `tests/fixtures/`.
- Do not commit credentials, tokens, private exports, or generated build artifacts.

## Suggested Issue labels

Recommended labels for coordination:

- `agent-friendly`
- `good first issue`
- `cad-core`
- `browser-smoke`
- `dxf`
- `stl`
- `docs`
- `validation`
- `needs-review`

If a label does not exist yet, still write the issue clearly; a maintainer can add labels later.
