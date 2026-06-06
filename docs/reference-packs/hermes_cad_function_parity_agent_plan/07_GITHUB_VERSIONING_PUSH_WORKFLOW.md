# GitHub-Versionierungs- und Push-Workflow für Hermes Agent

Dieser Workflow sorgt dafür, dass jede fertige Funktion rückgängig gemacht werden kann.

## Grundprinzip

- `main` bleibt stabil.
- Kein direkter Push auf `main`.
- Jede Arbeit startet aus einem Issue.
- Jede Arbeit hat eigenen Branch.
- Jede Arbeit bekommt Tests.
- Jede fertige Arbeit bekommt Commit, Changelog und Proof.
- Merge/Push auf stabile Branches nur nach grünem Check und Erlaubnis.

## Branch-Modell

```bash
main                  # stabil
dev/v0.3              # nächster Entwicklungsstand
agent/issue-45-active-edit-context
agent/issue-53-make-unique-local-axes
fix/issue-xx-short-name
docs/issue-xx-short-name
```

## Start eines Issues

```bash
git fetch origin
git checkout dev/v0.3
git pull --ff-only
git status --short
npm ci
npm run check
git checkout -b agent/issue-<nummer>-<kurzer-name>
```

Dann im GitHub Issue kommentieren:

```md
Claimed by Hermes Agent at <UTC time>.
I am starting work on branch `agent/issue-<nummer>-<kurzer-name>`.
I will use TDD, run `npm run check`, document SketchUp behavior comparison, and provide rollback notes.
```

## Vor Implementierung

Hermes muss speichern:

```bash
git status --short
git branch --show-current
git log --oneline -5
npm run check
```

Danach Recherche-Protokoll anlegen:

```text
docs/research/issue-<nummer>-sources.md
```

Inhalt:
- offizielle SketchUp-Quelle
- YouTube/Video-Quelle, falls Verhalten beobachtet wurde
- GitHub-/Open-Source-Quelle, falls Architektur-Idee benutzt wurde
- Hinweis: keine Assets/Code kopiert

## TDD-Regel

1. Test schreiben oder aktualisieren.
2. Test muss zuerst fehlschlagen, wenn möglich.
3. kleinste Implementierung.
4. fokussierten Test grün machen.
5. `npm run check`.
6. UI/Viewport: Smoke oder manuelle reproduzierbare Schritte.

## Commit-Regel

Conventional Commits:

```bash
git add .
git commit -m "feat(model): add component definitions and instances"
git commit -m "fix(ui): block inner geometry selection outside edit context"
git commit -m "test(push-pull): cover precise face extrusion distance"
git commit -m "docs(agent): add SketchUp behavior parity proof"
```

Jeder Commit darf nur eine klare Änderung enthalten.

## Versionierung

Für jede abgeschlossene Funktion:

- Patch-Version, wenn Bugfix:
  - `0.3.1`
- Minor-Version, wenn neue Funktion:
  - `0.4.0`
- Alpha/Beta, wenn noch im Entwicklungsbranch:
  - `0.3.0-alpha.1`
  - `0.3.0-beta.1`

Empfohlene Dateien:
- `CHANGELOG.md`
- `docs/releases/v0.3.0.md`
- optional `VERSION`

## Checkpoint-Tags

Vor riskanten Arbeiten:

```bash
git tag -a checkpoint/issue-<nummer>-before -m "Checkpoint before issue <nummer>"
git push origin checkpoint/issue-<nummer>-before
```

Nach grünem Abschluss:

```bash
git tag -a checkpoint/issue-<nummer>-green -m "Green checkpoint after issue <nummer>"
git push origin checkpoint/issue-<nummer>-green
```

Stabile Release-Tags:

```bash
git tag -a v0.3.0 -m "Hermes CAD v0.3.0"
git push origin v0.3.0
```

## Push-Regel

Nach grünem Check:

```bash
git push -u origin agent/issue-<nummer>-<kurzer-name>
```

Dann PR erstellen oder Marios fragen, ob Hermes Agent PR erstellen soll.

## Proof-Kommentar im Issue/PR

```md
## Hermes Proof Bundle

Branch:
`agent/issue-<nummer>-<slug>`

Changed files:
- ...

SketchUp behavior checked:
- Official source:
- Video/source:
- Behavior summary:

Implemented Hermes behavior:
- ...

Tests:
```bash
npm run test -- ...
npm run check
```

Result:
- PASS / FAIL

UI/Browser proof:
- Smoke command:
- Screenshot/video path if available:
- Manual steps:

Known limits:
- ...

Rollback:
- Revert commit: `<sha>`
- Or checkout tag: `checkpoint/issue-<nummer>-before`
```

## Rollback

Sicherer Rollback per revert:

```bash
git revert <commit-sha>
npm run check
git push
```

Lokaler Rollback zu Checkpoint:

```bash
git checkout checkpoint/issue-<nummer>-before
npm run check
```

Nie `git push --force` ohne ausdrückliche Erlaubnis von Marios.

## Stop-Bedingungen

Hermes muss stoppen und fragen, bevor:

- auf `main` gepusht wird
- `git push --force` genutzt wird
- Branches/Tags gelöscht werden
- Geometry-Kernel gewechselt wird
- kostenpflichtige Abhängigkeiten eingeführt werden
- native DWG/SKP/STEP/IFC-Unterstützung behauptet wird
- große Rewrites außerhalb einer Issue gemacht werden
