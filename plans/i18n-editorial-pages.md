# Plan: i18n — Polish & Spanish editorial pages

> Source PRD: [#66](https://github.com/auditmos/ogsfrompoly-lp/issues/66) — carved 2026-08-16 from the signed-off discovery record (Q1–Q10).
>
> **Status: delivered (2026-08-17).** All eight phases shipped; PRD [#66](https://github.com/auditmos/ogsfrompoly-lp/issues/66) and delivery track [#69](https://github.com/auditmos/ogsfrompoly-lp/issues/69) closed. One deviation from the PRD: no external translator was engaged — overlays are AI-generated and verified per locale with `pnpm i18n:slop`, with the stakeholder disclosure-policy gate kept and exercised (recorded on #69).

## Architectural decisions

Durable decisions that apply across all phases:

- **Routing**: Astro built-in i18n; locales `en` / `pl` / `es`; English stays unprefixed at the root (zero English URL changes), translated pages live under `/pl/` and `/es/`; unknown locale prefixes 404.
- **Architecture style**: one deep module — the **Translation Catalog** — is the single resolve function every consumer calls (HTML pages, `.md` twins, simulators, feeds): locale in, fully-typed page prose object out, same shape as the English original. No consumer contains its own fallback logic.
- **Data model**: English prose stays canonical in the typed TS content modules. Per-locale JSON overlays map stable keys to `{ translation, sourceHash }`. A translation renders only when it exists **and** its `sourceHash` matches the current English source; otherwise current English renders (per-key fallback). The English handoff JSON is generated, never hand-edited.
- **Key granularity**: section-level for long-form prose (one key per heading/section), string-level for labels, cards, and simulator text. A renamed/restructured key is a new key requiring retranslation.
- **Dual-format invariant per locale**: every translated page that has a `.md` twin stitches both surfaces from the same catalog-resolved strings. Home has no twin in English today and stays HTML-only in all locales (agreed scope reading of PRD story 13).
- **Disclosure policy**: translated, but English is authoritative; translated methodology carries a one-sentence note saying so.
- **Formatting**: locale-aware `Intl` number formatting on translated pages (`1 000,50` PL, `1.000,50` ES).
- **Frozen surfaces**: RSS byte-identical; statements, OG cards, and the statement schema untouched; no visitor-language auto-detection.
- **Never translated**: code identifiers, config knob names, `leader-a`/`leader-b` labels, install-snippet content, citations.
- **Verification**: routing behavior is verified against `pnpm preview`, never `pnpm dev` (known dev/prod divergence). Every phase ends with `pnpm types && pnpm test && pnpm lint && pnpm knip` green.

---

## Phase 1: Tracer bullet — Polish home page through the full stack

**User stories**: 1, 10, 12, 19, 21

### What to build

The thinnest end-to-end localized path, proving the risky assumption (Astro built-in i18n under `output: "server"` on the Cloudflare adapter) before anything builds on it. `/pl` renders the home page through the Translation Catalog with a handful of real Polish keys and correct `<html lang="pl">`. Fallback is demonstrably real: at least one key translated, one key missing, and one key with a deliberately mismatched `sourceHash` — the latter two render current English. `/fr` (any unknown locale) returns 404. The English root remains byte-untouched.

### Assumptions carried in

- The five editorial pages and their content modules exist as today; no content restructuring in this phase.
- Placeholder Polish strings are acceptable (real translator delivery arrives independently; fallback covers the gap by design).

### Out of scope for this phase

- Spanish entirely; the language switcher; hreflang tags; `.md` twins; the extractor script; full home coverage (only enough keys to prove the mechanism).

### Acceptance criteria

- [ ] Catalog resolve: translated key with matching hash → translation; missing key → English; hash mismatch → English; resolved object shape identical to the English original — [test: catalog unit tests via `pnpm test`]
- [ ] `/pl` returns 200 with `<html lang="pl">` and at least one Polish string visible — [observable: `curl` against `pnpm preview`]
- [ ] `/fr` and `/fr/anything` return 404 — [observable: `curl` against `pnpm preview`]
- [ ] `/` HTML output is unchanged from before the phase — [observable: diff of `curl /` against pre-phase capture]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 2: Translator handoff extractor

**User stories**: 16, 17, 18

### What to build

A pnpm script that walks the Catalog's English keys and produces two artifacts: the generated `en.json` handoff (key → English text + `sourceHash`) and a per-locale status report classifying every key as translated / missing / stale. Deterministic output; from this phase on, new keys added by later phases automatically appear in the handoff with no extra work.

### Assumptions carried in

- Phase 1's Catalog and key/hash model are stable; the extractor reads through the same public boundary (no parallel key discovery).

### Out of scope for this phase

- CI automation, TMS integrations, or any delivery tooling for the translator — the script is run manually.
- No new translated content.

### Acceptance criteria

- [ ] Fixture catalog in → deterministic handoff JSON and status report out; re-running with no changes is byte-identical — [test: snapshot tests via `pnpm test`]
- [ ] Editing one English fixture string flips exactly that key to `stale` in the report — [test: parametric case via `pnpm test`]
- [ ] The script exits 0 against the real catalog — [command: pnpm script run]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 3: Complete home in Polish + Spanish

**User stories**: 2, 8, 9, 12, 15, 22

### What to build

Every home-page string keyed through the Catalog, Spanish locale activated, hero claim translated in meaning, and the EN/PL/ES switcher component appearing on editorial pages only, linking to the same page in the chosen locale. hreflang alternates and canonical links wired for all three home variants.

### Assumptions carried in

- Phase 1 routing and fallback work; Phase 2 extractor picks up all new keys automatically.

### Out of scope for this phase

- Home `.md` twins (home stays HTML-only in all locales — agreed scope reading).
- Methodology, for-dummies, feeds.

### Acceptance criteria

- [ ] `/es` returns 200 with `<html lang="es">`; full key coverage on `/pl` and `/es` per the extractor report (zero missing keys for home) — [observable: status report + `curl` against `pnpm preview`]
- [ ] Hero claim renders translated on `/pl` and `/es` — [observable: `curl` against `pnpm preview`]
- [ ] Switcher present on all three home variants, each option linking to the same page in the target locale; absent on `/statements` and statement detail pages — [observable: `curl` checks against `pnpm preview`]
- [ ] All three home variants carry mutual hreflang alternates and self-canonicals — [observable: `curl` head inspection]
- [ ] English sitemap entries unchanged from before the feature — [test: sitemap snapshot diff via `pnpm test`]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 4: Methodology in Polish + Spanish

**User stories**: 3, 4, 11, 13, 20

### What to build

The long-form methodology prose split into section-level keys (the current single markdown blob becomes one key per heading/section), resolved through the Catalog for all three locales. Translated pages carry the one-sentence "English disclosure policy is authoritative" note. `.md` twins served per locale, stitched from the same resolved strings, with an invariant test proving HTML and twin can never disagree in any locale.

### Assumptions carried in

- Phases 1–3 mechanisms (routing, catalog, switcher, hreflang) work unchanged.
- The English methodology page's rendered output must remain semantically identical after the section-split refactor.

### Out of scope for this phase

- For-dummies pages, simulators, feeds.

### Acceptance criteria

- [ ] English `/methodology` and `/methodology.md` render the same content as before the section-split refactor — [observable: diff against pre-phase capture]
- [ ] `/pl/methodology` and `/es/methodology` return 200 with correct `lang`, switcher, hreflang; `.md` twins return `text/markdown` — [observable: `curl` against `pnpm preview`]
- [ ] HTML and `.md` twin resolve from identical strings per locale — [test: invariant test via `pnpm test`]
- [ ] Authority note present on translated methodology (HTML and twin), absent on English — [observable: `curl` content check]
- [ ] With one section's English edited, only that section falls back to English on translated pages; other sections stay translated — [test: catalog-level parametric test via `pnpm test`]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 5: For-dummies hub in Polish + Spanish

**User stories**: 5, 13

### What to build

The chooser hub's cards, facts, and comparison rows resolved through the Catalog for all three locales, with `.md` twins per locale under the same invariant test. Bot card links point to the same-locale walkthrough pages (which exist from Phases 6–7; until then they fall back to English routes — acceptable within the fallback policy).

### Assumptions carried in

- Phases 1–4 mechanisms unchanged; the hub's data-not-prose structure (cards/rows as arrays) is preserved, just locale-resolved.

### Out of scope for this phase

- The two bot walkthrough pages and their simulators.

### Acceptance criteria

- [ ] `/pl/for-dummies` and `/es/for-dummies` return 200 fully translated (zero missing hub keys in the extractor report), with correct `lang`, switcher, hreflang — [observable: status report + `curl` against `pnpm preview`]
- [ ] `.md` twins serve per locale and pass the shared invariant test — [test: `pnpm test`]
- [ ] English hub HTML and twin unchanged — [observable: diff against pre-phase capture]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 6: Copy-cluster walkthrough complete in Polish + Spanish

**User stories**: 5, 6, 7, 13

### What to build

The cluster bot page end-to-end in all three locales: prose through the Catalog, simulator decision strings resolved per locale and shipped to the client so the live recompute rewrites text in-language, `Intl` number formatting per locale, and `.md` twins under the invariant test. This phase builds the localized-simulator mechanism (locale-parameterized simulator strings + formatters) that Phase 7 reuses.

### Assumptions carried in

- The simulator's evaluate function stays the single source of truth for SSR paint and client recompute — localization parameterizes its strings, never forks its logic.
- Knob values still mirror the upstream YAML; numbers themselves are formatted, never translated.

### Out of scope for this phase

- The wallet bot page; feeds.

### Acceptance criteria

- [ ] Locale-parameterized formatters produce `1 000,50` (PL) and `1.000,50` (ES) — [test: formatter unit tests via `pnpm test`]
- [ ] Simulator string resolution per locale covered at the module boundary — [test: `pnpm test`]
- [ ] On `/pl/for-dummies/copy-cluster` under `pnpm preview`, moving a knob rewrites the decision text in Polish — [observable: browser-automation smoke check]
- [ ] `.md` twins per locale pass the invariant test; English page and twin unchanged — [test + observable: `pnpm test`, diff against pre-phase capture]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 7: Copy-wallet walkthrough complete in Polish + Spanish

**User stories**: 5, 6, 7, 13

### What to build

The wallet bot page given the identical treatment, reusing Phase 6's localized-simulator mechanism: prose, simulator strings, `Intl` formatting, `.md` twins, all three locales.

### Assumptions carried in

- Phase 6's mechanism generalizes; no new i18n machinery is built here.
- Leader wallets appear only as their anonymous config labels in every locale (labels are never translated).

### Out of scope for this phase

- Feeds; any new simulator features.

### Acceptance criteria

- [ ] `/pl/for-dummies/copy-wallet` and `/es/for-dummies/copy-wallet` return 200 fully translated with working in-language simulator recompute — [observable: status report + browser-automation smoke check against `pnpm preview`]
- [ ] `.md` twins per locale pass the invariant test; English page and twin unchanged — [test + observable: `pnpm test`, diff against pre-phase capture]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]

---

## Phase 8: Feeds & SEO closure

**User stories**: 14, 15, 22, 23

### What to build

The discovery layer catches up with everything shipped: `llms.txt` gains per-language sections listing the six translated `.md` twins (methodology + hub + two bot pages × two locales); the sitemap gains all localized URLs with hreflang alternates while English entries stay identical; RSS is proven byte-identical to before the feature; statements surfaces are verified untouched and switcher-free.

### Assumptions carried in

- All translated pages and twins from Phases 3–7 exist and are stable.

### Out of scope for this phase

- Any RSS localization; OG card changes; statement schema changes.

### Acceptance criteria

- [ ] `llms.txt` lists all six translated twins grouped per language; titles/summaries imported from the same content modules (no restated strings) — [test: llms.txt snapshot via `pnpm test`]
- [ ] Sitemap contains all localized URLs with hreflang alternates; English entries byte-identical to pre-feature snapshot — [test: sitemap snapshot via `pnpm test`]
- [ ] RSS output byte-identical to pre-feature snapshot — [test: RSS snapshot via `pnpm test`]
- [ ] Statement pages carry no switcher and no hreflang to nonexistent translations — [observable: `curl` checks against `pnpm preview`]
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass — [command]
