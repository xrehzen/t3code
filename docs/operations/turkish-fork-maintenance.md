# Keeping a Turkish fork alive

Upstream is fast. It was created in February 2026 and was still receiving commits
the same day this fork's first release was built. A fixed fork falls behind in
weeks, not months, so the interesting question is not "is the fork good" but
"what happens the day upstream refactors the file the translation lives in".

This page is for whoever picks this up next.

## What the tests already protect

`packages/shared/src/i18n/index.test.ts` fails when:

- an English key has no translation in any locale
- a translation's `{slots}` disagree with the English original
- a locale defines a key English does not

That covers the failure that actually bites: a Turkish string quietly shipping in
English, or a placeholder that renders `{count}` to the user. No extra workflow is
needed — `ci.yml` already runs `vp run --filter ... test` across every package
including `@t3tools/shared`, and `knip:check` already covers unused exports. The
gate exists; it just lives in the suite rather than in a script that could drift
from it.

## What the tests do not protect

**Upstream refactors a component.** The catalog key survives, the call site
does not, and nothing goes red — the string simply reverts to English. The
symptom is a partly Turkish interface, which is easy to miss in review.

The mitigation is a build, not a test. `T3CODE_DEFAULT_LOCALE=tr` produces the
artifact where every gap is visible at once:

```sh
T3CODE_DEFAULT_LOCALE=tr \
T3CODE_DESKTOP_UPDATE_REPOSITORY=xrehzen/t3code \
  vp run dist:desktop:artifact --platform linux --target AppImage --arch x64 \
    --build-version 0.0.42-tr.2 --output-dir release/tr
```

Run it after each rebase. Both `--output-dir` and the version matter: the
artifact name is fixed, so a second build overwrites the first, and the locale
is compiled into the web bundle, so a `--skip-build` run would ship the previous
language under the new file name.

## The rebase rhythm

`upstream` is configured. Upstream publishes daily, so rebasing on a schedule
rather than on demand is what keeps a conflict window short:

```sh
git fetch upstream
git rebase upstream/main
```

A conflict in a `.tsx` file is a merge of _meaning_, not of text: upstream moved
a string, and both the move and the new location need the `t()` call. Resolve by
keeping upstream's structure and re-applying the translation to wherever the
string ended up.

`packages/shared/src/i18n/` conflicts are the cheap kind — the keys are data.
Where upstream adds an English key, add the Turkish line next to it in the same
commit, or the coverage test goes red.

## Version numbers

Turkish versions sit on their own increasing line — `0.0.42-tr.1`,
`0.0.42-tr.2` — and must not carry `-pr.` or `-preview.`. The build drops the
publish config for a preview version, so the app would ship with no update feed
and the user would see _"Automatic updates are not available because no update
feed is configured."_

## What is deliberately not translated

`searchTerms` arrays, product names, key names, brand names, file extensions,
Electron's own `role:` menu labels (those come from the `tr.pak` Chromium ships,
not from us), and server error text — which arrives as a flat `Schema.String`
with no machine-readable code, and `connection/platform.ts` parses it. Changing
that is a contract change, not a translation task.

`docs/internals/i18n.md` has the full list with reasons.
