# GitHub Issue Template: Function Parity Task

```md
# feat(<area>): <function> SketchUp-like parity

## Goal

Implement or repair `<function>` so it is functionally usable in Hermes CAD, not decorative, and independently follows the relevant SketchUp-like workflow.

## User value

Marios needs this because:
- ...

## Current Hermes behavior

Files to inspect:
- ...

Current state:
- ...

## SketchUp behavior baseline

Official sources:
- ...

Observed behavior:
- ...

Important: do not copy SketchUp icons, text, UI assets, or protected designs.

## Scope

In scope:
- ...
- tests
- docs
- undo/redo
- save/load
- active context
- measurement box if relevant

Out of scope:
- ...
- unsupported formats/features

## Acceptance criteria

- [ ] UI control is connected to real model logic.
- [ ] Works in millimeters.
- [ ] Invalid input fails safely.
- [ ] Undo/Redo works.
- [ ] Save/Load works.
- [ ] Tests prove model behavior.
- [ ] UI/Smoke proof exists.
- [ ] README/AGENTS/CHANGELOG updated.
- [ ] SketchUp comparison documented.
- [ ] No copied SketchUp/Trimble assets.
- [ ] Rollback note provided.

## TDD plan

1. Add failing test:
2. Implement:
3. Run focused tests:
4. Run full check:

## Verification commands

```bash
npm ci
npm run test -- <focused-test>
npm run check
npm run smoke:browser
```

## Versioning

Branch:
`agent/issue-<number>-<slug>`

Expected commit:
`feat(<area>): <summary>`

Rollback:
- checkpoint tag:
- revert commit:

## Proof bundle

To be posted before merge:
- branch
- changed files
- commands/results
- screenshots/smoke output
- known limits
- rollback
```
