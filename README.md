# dep-guard

Scans your npm dependency tree for two supply-chain attack signatures:

- **Typosquat risk** - a dependency name that's 1-2 characters from a well-known package (e.g. `lodahs` vs `lodash`).
- **Ownership-change risk** - a package whose latest version was published by a brand-new npm account right after a long run of releases from one consistent publisher - the shape of an npm account takeover, not routine co-maintainer rotation.

## Usage

```sh
npx dep-guard [path-to-project]
```

Defaults to the current directory. Reads `dependencies` and `devDependencies` from `package.json`, checks each against the npm registry, and prints findings. Exits with code `1` if anything was flagged, so it works as a CI gate:

```yaml
# .github/workflows/dep-guard.yml
- run: npx dep-guard
```

## What it does *not* do

This is advisory, not a verdict. A flag means "worth a human look," not "definitely malicious." It doesn't scan code for malware, doesn't check licenses, and doesn't replace a real security audit. It's one cheap, fast signal running on every install/PR.

## How the typosquat check works

Compares each dependency name against a bundled list of ~2,300 well-known npm packages (`src/top-packages.json`, regenerated via `scripts/build-top-packages.js`) using Levenshtein edit distance. Flags names within distance 1-2 of a popular package, unless the name *is* that package.

## How the ownership-change check works

Fetches the full package metadata from the npm registry, orders all versions by publish date, and looks at which npm account published each one. If a package has a stable history (5+ versions, all from one publisher) and the *latest* version was published by a never-before-seen account within the last 60 days, that's flagged.

## License

MIT
