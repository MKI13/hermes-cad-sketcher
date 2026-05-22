---
name: Agent task
about: Focused implementation or verification work for human or AI contributors
title: "[Agent task] "
labels: agent-friendly
assignees: ''
---

## Ziel

What should be true when this task is done?

## Scope

In scope:

- 

Out of scope:

- 

## Acceptance Criteria

- [ ] The change is small and focused.
- [ ] CAD-/Dateiformat-Grenzen are explicitly documented when import/export, geometry, or compatibility is affected.
- [ ] Millimeter semantics remain stable.
- [ ] No full DXF, DWG, SKP, STEP, IFC, `.rb`, or `.rbz` support is claimed unless it is truly implemented and verified.
- [ ] Keine echten Kunden- oder privaten Dateien are used in fixtures, screenshots, comments, or commits.

## Verification

Required commands/evidence:

```bash
npm run check
```

If UI/browser behavior changes, also include:

```bash
npm run build
npm run smoke:browser
```

## Suggested files or areas

- 

## Coordination notes

Mention related Issues, PRs, or agents here. If blocked, describe the blocker and the exact evidence.
