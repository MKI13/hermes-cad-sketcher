# Pull Request Template für Hermes CAD

```md
## Summary

What changed?

## Related issue

Closes #

## SketchUp-like behavior checked

Official sources:
- ...

Behavior baseline:
- ...

Hermes implementation:
- ...

No SketchUp/Trimble assets copied:
- [ ] confirmed

## Functional status

- [ ] ready
- [ ] experimental
- [ ] planned/disabled

## Changed files

- ...

## Tests

```bash
npm run test -- ...
npm run check
```

Result:

## UI / Browser proof

Smoke command:
Manual steps:
Screenshot/video if available:

## Versioning

Branch:
Commit(s):
Changelog entry:
Checkpoint tag:

## Rollback

Revert:
```bash
git revert <sha>
```

Checkpoint:
```bash
git checkout checkpoint/issue-...
```

## Known limits

- ...
```
