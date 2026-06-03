# Plan: Slice 11 — Build Log + `/about`

> Source PRD: [auditmos/ogsfrompoly-lp#12](https://github.com/auditmos/ogsfrompoly-lp/issues/12) (carved from parent PRD [#1](https://github.com/auditmos/ogsfrompoly-lp/issues/1))
>
> Parent plan: [`plans/ogsfrompoly-lp.md`](./ogsfrompoly-lp.md) — this file replaces the Phase 5 stub.

## Architectural decisions

Durable decisions that apply across all phases of Slice 11. Reference these when in doubt — they should not change phase-to-phase. The parent plan's architectural decisions (Astro SSR on Cloudflare Workers, content collections, dual-format invariant, feed-from-collections, disclosure policy, brand voice anchor, hosting) all apply unchanged.

- **New entity — `Article`**: frontmatter fields `title`, `slug`, `date`, `series` (enum: `build-log` | `essay`), `episode_number` (integer, required when `series === "build-log"`), `summary`, `tags`, `author`, `reading_time` (minutes), `commit_range` (array of SHAs or refs, **internal metadata only**), `hero` (optional URL). Body: markdown narrative.
- **Single `article` collection, series-discriminated**: one Astro content collection serves both the Build Log series and ad-hoc essays. The `series` field discriminates. Adding a second series later means adding an enum value, not a new collection.
- **Independent `SCHEMA_VERSION_ARTICLE`**: articles are an LP-only contract with no upstream producer; the article schema version evolves independently of the statement schema version. Bumps follow the same breaking-change discipline.
- **URL contract**: `/articles/<slug>` (HTML) and `/articles/<slug>.md` (text/markdown). Flat namespace; the existing Dual-Format Serving deep module picks up the new collection with zero new per-route code.
- **Feed contract**: `rss.xml`, `llms.txt`, `sitemap.xml` stay combined — statements and articles share one stream. No per-collection feed surface.
- **Listing order**: `/articles/` lists by `episode_number` ascending within `build-log`; essays appear inline by `date` descending alongside.
- **Disclosure stance for articles**: **full methodology detail**. Articles narrate mechanics in citable form. The parent disclosure policy still binds — no wallet IDs, no live alerts, no content that could front-run an open position. Self-review by the author is the pre-merge gate.
- **Generation workflow**: hybrid — LLM drafts from a commit-range bundle produced by a small extraction script in this repo; the author curates for voice. Upstream `auditmos/ogsfrompoly` is private, so articles embed code/diff excerpts inline rather than linking to commits.
- **Identity**: named single author — Tom Kowalczyk — on `/about` with real photo and credentials. The about page commits to solo-founder framing.
- **Episode-numbering policy**: episode numbers are integers, monotonic, never re-numbered. Retroactive inserts use decimals (`3.5`). Re-numbering existing entries is forbidden — would break `/articles/<slug>` permalinks and feed history.
- **Hero strategy**: launch is typographic-only. The `hero` field accepts an optional URL but launch articles ship without imagery.
- **Post-launch cadence**: tied to upstream poly-track milestones, not the calendar. The 8–10 launch articles are the "active maintenance" signal; future articles are bonus.
- **Verification gate**: every phase ends with `pnpm types && pnpm test && pnpm lint && pnpm knip` passing locally and in CI, plus phase-specific acceptance criteria below.

---

## Phase 1 — Article spine: collection + schema + dual-format + feeds + listing

**User stories** (from PRD #12): 12, 13, 14, 16, 19, 20

### What to build

A thin vertical slice that proves the architecture before any article is written. Define the `article` content collection with its Zod schema, including the `series` discriminator and the conditional `episode_number` requirement. Commit one placeholder article entry (real frontmatter shape, throwaway prose, `series: build-log`, `episode_number: 0` reserved for the stub). Verify that the existing Dual-Format Serving deep module resolves both `/articles/<slug>` and `/articles/<slug>.md` without per-route code. Verify that the existing Feed Generators deep module includes the new collection in `rss.xml`, `llms.txt`, and `sitemap.xml` without code changes. Build the `/articles/` listing page as composition over the collection — sorted by `episode_number` ascending for `build-log` entries, inline by date for essays. Extend the schema rejection tests to cover article-specific malformed cases. Extend the dual-format integration tests to iterate over the new collection.

This is the architecture validation. Phase 2 ships in parallel; Phase 3 replaces the placeholder. Neither needs structural changes after this phase lands.

### Acceptance criteria

- [ ] `article` content collection with Zod-validated frontmatter is live; an `article` SCHEMA_VERSION marker is defined and exported
- [ ] A PR that adds a markdown file with malformed article frontmatter (missing required field, wrong `series` enum, missing `episode_number` when `series === "build-log"`, malformed `commit_range`) fails CI before merge; error message identifies the bad field
- [ ] The placeholder article resolves at `/articles/<slug>` (200 `text/html`) and `/articles/<slug>.md` (200 `text/markdown`) with body matching the source markdown
- [ ] `rss.xml`, `llms.txt`, and `sitemap.xml` include the placeholder article alongside existing statements
- [ ] Feed snapshot tests are deterministic over a fixture set that contains both statements and articles
- [ ] `/articles/` listing page renders the placeholder, sorted by `episode_number` ascending
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI

---

## Phase 2 — About page

**User stories** (from PRD #12): 1, 2, 3

### What to build

The `/about` page as static composition — no schema, no collection, no dependency on Phase 1. Parallel-able with Phase 1 work. The page contains: a 1–2 paragraph origin story, an author bio with real photo and credentials, the partnership-inquiry contact (same address as the homepage footer), and public links to GitHub / X / LinkedIn. The aesthetic register matches the rest of the site (Hermes-adjacent display type, monospace meta block).

After Phase 2, a cold reader can answer "who built this and how do I contact them" without leaving the site.

### Acceptance criteria

- [ ] `/about` resolves with HTTPS over `ogsfrompoly.com/about`
- [ ] Origin story (1–2 paragraphs) renders with the project's actual provenance
- [ ] Author bio with real name, real photo, and credentials relevant to the project's credibility is visible above the fold
- [ ] Partnership-inquiry contact link matches the homepage footer address
- [ ] GitHub, X, and LinkedIn links resolve and load the named author's profile
- [ ] Manual side-by-side review against the homepage confirms aesthetic consistency (display type, color, monospace meta block)
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI

---

## Phase 3 — Workflow tracer: extraction script + Episode 1

**User stories** (from PRD #12): 4, 7, 9, 10, 11, 17, 21

### What to build

Prove the hybrid generation workflow end-to-end before scaling. Build a small extraction script in this repo that reads a commit range from the sibling `auditmos/ogsfrompoly` checkout and emits a structured markdown bundle (commit messages, file-level diffs, scope-relevant excerpts) ready to paste into Claude. The script is a sibling deep module — small CLI interface (`<repo-path> <commit-range>` → markdown bundle on stdout), hidden implementation (git invocation, formatting, inclusion heuristics). Tests are deliberately scoped to manual inspection of the bundle output — boundary snapshot tests are explicitly out of scope per the PRD.

Use the script to draft Build Log Episode 1 — "Replicating sign-randomization on real Polymarket data" — via the hybrid path: extract a commit range, paste into Claude, curate for voice and opinion, run disclosure-policy self-review, commit. Episode 1 replaces the placeholder article from Phase 1. The article embeds code/diff excerpts inline (upstream repo is private, so no clickable commit links).

After Phase 3, the workflow is proven on real content. The remaining episodes are batches of the same recipe.

### Acceptance criteria

- [ ] Extraction script lives in this repo and runs against a sibling poly-track checkout via a documented CLI invocation
- [ ] Script emits a markdown bundle to stdout containing: commit messages with SHAs, file-level diffs scoped to the range, and a top-level "context for the article" preamble
- [ ] Episode 1 ("Replicating sign-randomization on real Polymarket data") is published at `/articles/replicating-sign-randomization` (or equivalent slug), `episode_number: 1`, ~800–1200 words, narrative-led
- [ ] Episode 1 embeds at least one code excerpt or diff block inline — no clickable links to private commits
- [ ] Episode 1's `commit_range` frontmatter field captures the SHAs the article narrates (internal metadata only — not rendered in the HTML or markdown body)
- [ ] Episode 1 passes the author's disclosure-policy self-review against `docs/disclosure-policy.md`
- [ ] The Phase 1 placeholder article is removed; Episode 1 takes its slot in the feeds and listing
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI

---

## Phase 4 — Build Log batch + launch acceptance

**User stories** (from PRD #12): 4, 5, 6, 8, 15, 18, 22

### What to build

Scale the proven workflow from Phase 3 across the rest of the slate. Ship episodes 2–8 to hit the 8-article launch floor, with episodes 9 and 10 as stretch additions if cadence allows. Each article follows the same recipe: extraction script → LLM draft → author curation → disclosure-policy self-review → merge. Articles ship in batches (one PR per article or per small group), preserving review-ability.

The proposed launch slate (lock 8, stretch to 10):

1. Replicating sign-randomization on real Polymarket data *(shipped in Phase 3)*
2. Building the warehouse: storage choice and category coverage
3. Why we excluded sports
4. The first failed paper replication — structural divergence finding
5. From peak-fill anchor to external calendar
6. Adding cluster detection and counterparty HHI
7. Performance lessons: when to measure, when to extrapolate
8. Long-running scripts and the heartbeat discipline
9. *(stretch)* The open-book P&L: designing statements for the project itself
10. *(stretch)* Schema-as-contract: how the LP forced a producer/consumer split

Once the floor is hit, run the launch acceptance battery: LLM install-snippet recheck against the expanded content surface, staging walkthrough of `/about` and `/articles/`, and final sign-off recorded in the repo.

After Phase 4, Slice 11 is launched. Future articles ship on the post-launch cadence: tied to upstream poly-track milestones, not the calendar.

### Acceptance criteria

- [ ] At least 8 Build Log articles are live, episode-numbered consecutively from 1
- [ ] Every article covers a distinct phase of poly-track's evolution (no duplicates, no overlapping scope)
- [ ] Every article passes the author's disclosure-policy self-review and the result is recorded (commit message or PR description)
- [ ] No published article contains a wallet ID, an alert payload, or content that could front-run an open position
- [ ] LLM install-snippet manual recheck: paste the homepage install snippet into Claude and ChatGPT, ask "summarize ogsfrompoly's methodology evolution" — both produce substantively correct answers derived from article content alone
- [ ] Staging walkthrough of `/about`, `/articles/`, and a representative article confirms typography, hero rendering, embedded snippet blocks, and feed pickup all behave as designed
- [ ] Cloudflare Web Analytics confirms hits are recorded for `/about`, `/articles/`, and individual article URLs (plus their `.md` counterparts) within the documented latency
- [ ] "Slice 11 launched" sign-off recorded in the repo (commit, PR description, or issue #12 closing comment)
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI
