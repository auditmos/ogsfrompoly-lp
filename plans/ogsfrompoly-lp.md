# Plan: ogsfrompoly.com landing page

> Source PRD: [auditmos/ogsfrompoly-lp#1](https://github.com/auditmos/ogsfrompoly-lp/issues/1)

## Architectural decisions

Durable decisions that apply across all phases. Reference these when in doubt — they should not change phase-to-phase.

- **Architecture style**: Astro 6 SSR on Cloudflare Workers (`output: "server"`), single Worker per environment. Pages render at request time. No static export.
- **Content storage**: Markdown in `src/content/` via Astro content collections. Single source of truth. No CMS, no submodule, no runtime fetch from upstream.
- **Content schema = cross-repo contract**: Zod-validated frontmatter is the stable interface between this repo and any upstream content producer (manual today, automated v2). Changing the schema is a breaking change for upstream automation.
- **Key entities**:
  - `Statement` — frontmatter: period (`weekly` | `monthly`), period_start (ISO date), period_end (ISO date), title, summary, plus type-specific structured fields (counts, hit rates, P&L for monthly). Body: markdown commentary.
  - `Article` (v2): frontmatter: title, slug, date, series, summary, tags.
- **Dual-format invariant**: Every published content entry resolves at both `/<collection>/<slug>` (HTML) and `/<collection>/<slug>.md` (raw markdown, `Content-Type: text/markdown`). Adding a new content type adds dual-format routes by default — never per-route boilerplate.
- **Feed sources**: `rss.xml`, `llms.txt`, `sitemap.xml` are derived from content collections at build/render time. Never hand-maintained.
- **Disclosure policy (load-bearing)**: methodology + aggregate results only. Wallets appear as truncated/hashed IDs only (e.g. `wallet_a3f…`). Live alpha never published. The schema and the methodology page both reflect this.
- **Distribution model**: RSS + `.md` feed. No email capture, no signup, no newsletter, no comments. Contact is a discreet footer link.
- **Brand voice anchor**: [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/) — bold display type, terminal/install-snippet moments, opinionated function-forward copy.
- **Hosting**: `ogsfrompoly.com` via Cloudflare custom domain (`custom_domain: true`). Three wrangler env blocks (`dev`, `staging`, `production`). Cloudflare Web Analytics (cookie-less) for visit telemetry. All secrets in Cloudflare / CI store, never in repo.
- **Verification gate**: every phase ends with `pnpm types && pnpm test && pnpm lint && pnpm knip` passing locally and in CI, plus phase-specific acceptance criteria below.

---

## Phase 1 — Skeleton tracer: one route live end-to-end

**User stories**: 9, 10, 11, 12, 13, 16, 17, 18, 19, 21, 23 (from PRD)

### What to build

A thin vertical slice that proves every load-bearing piece works together before any content or design effort. Define the `statement` content collection with its Zod schema. Commit one placeholder statement (real frontmatter shape, throwaway prose). Wire the dual-format serving so the placeholder resolves at both `/statements/<slug>` (HTML, minimal layout) and `/statements/<slug>.md` (raw markdown). Generate `rss.xml`, `llms.txt`, and `sitemap.xml` from the collection. Configure the Cloudflare Worker with the `production` env to deploy to `ogsfrompoly.com` over HTTPS with the cookie-less Cloudflare Web Analytics script enabled. CI runs the four-command verification gate plus the automated tests for the three deep modules (schema rejection, dual-format invariant, feed determinism).

This is the spine. Phase 2 adds the marketing surface on top; Phase 3 replaces the placeholder with real content. Neither needs structural changes after this phase lands.

### Acceptance criteria

- [ ] `ogsfrompoly.com` resolves to the deployed Worker over HTTPS with a valid certificate
- [ ] A PR that adds a markdown file with malformed statement frontmatter (missing required field or wrong type) fails CI before merge; error message identifies the bad field
- [ ] For every entry in the `statement` collection, `/statements/<slug>` returns `200 text/html` and `/statements/<slug>.md` returns `200 text/markdown` with body matching the source markdown
- [ ] `rss.xml`, `llms.txt`, `sitemap.xml` are reachable, valid, and include the placeholder statement
- [ ] A snapshot test demonstrates that adding/removing a fixture entry produces a deterministic, reviewable diff in all three feeds
- [ ] Cloudflare Web Analytics dashboard registers a hit after a manual visit
- [ ] No cookies set by any first- or third-party script (verified via browser devtools)
- [ ] No secrets committed to the repo (Cloudflare API tokens live only in CI / Cloudflare dashboard)
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI

---

## Phase 2 — Site looks like itself: brand, homepage, methodology

**User stories**: 1, 2, 3, 7, 8, 14, 20

### What to build

The marketing surface, layered on the spine from Phase 1. Build the Tailwind v4 token set and a small library of opinionated component primitives reflecting the Hermes-adjacent register (display heading, terminal install-snippet block, statement card, statement table). Build the homepage with hero, install snippet, latest-statement teaser pulled live from the `statement` collection, and a footer with a discreet partnership-inquiry contact link. Build the `/methodology` page citing the two source papers, explaining the sign-randomization skill test, listing tracked categories, and stating the disclosure policy (aggregate-only, truncated wallet IDs, no live alpha).

The placeholder statement from Phase 1 remains in place; Phase 3 replaces it. After Phase 2, a cold reader landing on `ogsfrompoly.com` understands what the project is, what its methodology claims, and where the cadence promise lives — even though the only available statement is the placeholder.

### Acceptance criteria

- [ ] Homepage hero communicates the project's function and cadence promise within five seconds of landing (manual review against the PRD hero claim)
- [ ] The homepage install snippet is copy-pasteable and produces a real result when run against the deployed site
- [ ] Methodology page cites both source papers (Gomez-Cram et al. 2026; Akey et al. 2026), explains the skill test, and explicitly states the wallet-anonymization policy
- [ ] Homepage latest-statement teaser links to the most recent entry in the `statement` collection without manual update (derived from the collection at render time)
- [ ] Footer contact link is present and discreet (single line, no form, no marketing copy)
- [ ] Side-by-side review against `hermes-agent.nousresearch.com` confirms the aesthetic register landed (manual check; sign-off recorded)
- [ ] LLM install snippet manual acceptance: paste the snippet into Claude and ChatGPT, ask *"what does ogsfrompoly do?"*, confirm both produce substantively correct answers derived from feed content alone
- [ ] `pnpm types && pnpm test && pnpm lint && pnpm knip` all pass in CI

---

## Phase 3 — Real content + launch acceptance

**User stories**: 4, 5, 6, 15, 22

### What to build

Replace the Phase 1 placeholder with two handcrafted real statements: one weekly and one monthly. The weekly demonstrates the lightweight cadence artifact (strategy track record snapshot + commentary). The monthly demonstrates the full open-book format including the project P&L section (operating costs, any revenue, runway commentary). Lock the `statement` frontmatter schema based on whatever the handcrafted versions actually need — this freezes the cross-repo contract that v2 automation will satisfy. Run the final manual launch acceptance battery and record sign-off.

This phase produces no new components — only real content and the schema-freeze decision. After this phase, v1 is launched: the site has real numbers, real commentary, and the cross-repo schema is stable.

### Acceptance criteria

- [ ] One real weekly statement is published with hit rate, alert count, hypothetical PnL on a stated bankroll, and category coverage
- [ ] One real monthly statement is published including all weekly fields plus a project P&L section (revenue, opex, runway)
- [ ] Every wallet reference in both statements uses truncated/hashed IDs only — no full addresses anywhere in the rendered HTML or `.md` output
- [ ] Statement frontmatter schema is documented in the repo as the stable cross-repo contract; a schema-change requires explicit version bump notation
- [ ] Final LLM install snippet acceptance re-run against real content (not placeholder) still produces substantively correct answers
- [ ] Cloudflare Web Analytics confirms visits are recorded for both statement URLs and their `.md` counterparts within the documented latency
- [ ] Operator can identify referrer / corporate IP ranges from the CF Web Analytics dashboard for weak-signal acquirer-interest tracking
- [ ] v1 launch checklist (PRD "Definition of v1 launched") signed off in the repo

---

## Phase 4 — Cross-repo automation: poly-track → LP (v2)

**User stories** (forward-looking): the "author" stories already covered in v1 become *operator* stories in v2 — the publishing surface stays the same; the producer changes from human to CLI.

### What to build

Add a `poly-track report public {weekly,monthly}` subcommand to the upstream poly-track CLI that reads the warehouse and emits a markdown file matching the schema frozen in Phase 3. A GitHub Action in poly-track runs on the agreed cron (weekly on a fixed weekday; monthly on a fixed day-of-month), invokes the CLI, and opens a pull request on `ogsfrompoly-lp` via a fine-scoped GitHub App token containing only the generated markdown file. Cloudflare deploys on merge.

The schema does not change. The site does not change. Only the producer changes.

### Acceptance criteria

- [ ] poly-track CLI subcommand emits a markdown file that passes the LP's schema validation when committed
- [ ] GitHub Action in poly-track runs on cron, opens a PR on `ogsfrompoly-lp` via a fine-scoped GitHub App (not a PAT)
- [ ] PR merges trigger a Cloudflare deploy that renders the new statement at its stable URL
- [ ] A statement schema change in the LP repo fails the poly-track CLI's local validation before commit, signalling the breaking change
- [ ] Authoring runbook documents the manual-fallback path if the GitHub App token rotates or the cron misses

---

## Phase 5 — Build Log series + about page (v2)

### What to build

The "How this project was built" article series, derived from poly-track's git history and code changes. Each article narrates a build phase / refactor / methodology evolution and links to the relevant commit range. Generation method (LLM-summarized commits vs hand-written narrative; or hybrid: LLM produces the draft, human curates) is a Phase 5 discovery question — defer until v1 is in market and the cadence cost is known. Add an `/about` page covering the team (or single author), project origin, and acquirer-conversation contact.

The `article` content collection is added to the LP repo with its own Zod schema. Dual-format serving and feed generation pick up the new collection without code changes (this is what the Phase 1 deep modules buy).

### Acceptance criteria

- [ ] `article` content collection with Zod-validated frontmatter; CI rejects malformed entries
- [ ] Articles resolve at `/articles/<slug>` and `/articles/<slug>.md` with no new per-route code
- [ ] `rss.xml`, `llms.txt`, `sitemap.xml` automatically include articles alongside statements
- [ ] At least three Build Log articles published covering distinct phases of poly-track's evolution
- [ ] `/about` page is live and links to the partnership-inquiry contact
- [ ] LLM install snippet manual check still passes with the expanded content surface
