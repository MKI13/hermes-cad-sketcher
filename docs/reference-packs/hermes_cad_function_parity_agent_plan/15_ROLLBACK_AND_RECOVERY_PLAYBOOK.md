# Rollback und Recovery Playbook

## Wann Rollback?

- neue Funktion bricht bestehende CAD-Funktion
- `npm run check` schlägt nach Merge fehl
- UI ist unbenutzbar
- Projektdateien laden nicht mehr
- Import/Export beschädigt Daten
- Komponenten/Undo/Redo inkonsistent

## Sicherer Rollback

```bash
git log --oneline -10
git revert <bad-commit-sha>
npm run check
git push
```

## Zurück zu Checkpoint lokal

```bash
git fetch --tags
git checkout checkpoint/issue-<nummer>-before
npm run check
```

## Neue Fix-Branch aus stabilem Stand

```bash
git checkout dev/v0.3
git pull --ff-only
git checkout -b fix/issue-<nummer>-rollback-repair
```

## Projektdatei-Migration zurücknehmen

Wenn `.hcad.json` Schema geändert wurde:
- alte Fixtures behalten
- Migration rückwärts dokumentieren
- niemals alte Projektdateien ohne Fehlermeldung falsch laden
- bei Breaking Change neue Version + Migrationstest

## Niemals ohne Marios

- force push
- main reset
- tag löschen
- branch löschen
- history rewrite
