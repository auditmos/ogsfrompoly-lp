# ogsfrompoly-lp

*AI agent index: [llms.txt](./llms.txt)*

Source for **ogsfrompoly.com** — the public-facing landing page for [poly-track](../ogsfrompoly), a Polymarket skilled-trader detection project grounded in the 2026 papers by Gomez-Cram et al. and Akey et al.

The site publishes methodology, aggregate results, and open-book "financial statements" (strategy track record + project P&L) at a regular weekly + monthly cadence. Distribution is RSS plus per-page raw markdown (`/<slug>.md`) for LLM agents. No email capture, no signup, no comments.

> **Disclosure policy (load-bearing):** methodology + aggregate results only. Wallet references appear only as truncated / hashed IDs (e.g. `wallet_a3f…`). Live alpha is never published. See `/methodology` on the deployed site and `docs/` for the authoritative version.

## Status

- **PRD:** [#1](https://github.com/auditmos/ogsfrompoly-lp/issues/1) — single source of truth for scope, user stories, validation strategy
- **Implementation plan:** [`plans/ogsfrompoly-lp.md`](plans/ogsfrompoly-lp.md) — phased vertical slices
- **Issues:** [#2–#10](https://github.com/auditmos/ogsfrompoly-lp/issues?q=is%3Aopen+label%3Av1) (v1) · [#11–#12](https://github.com/auditmos/ogsfrompoly-lp/issues?q=is%3Aopen+label%3Av2) (v2, deferred)
- **Domain:** `ogsfrompoly.com` (registered at Cloudflare Registrar; zone active)

## Quick start

```bash
pnpm install
pnpm cf-typegen
pnpm dev          # http://localhost:3000
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (`output: "server"`) |
| Adapter | `@astrojs/cloudflare` |
| Runtime | Cloudflare Workers (`nodejs_compat`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), no JS config |
| Content | Astro content collections (markdown in `src/content/`) |
| Validation | Zod (frontmatter + endpoint boundaries) |
| Language | TypeScript strict (`@/*` → `src/*`) |
| Linter | Biome 2 |
| Testing | Vitest |
| Dead-code | knip |
| Analytics | Cloudflare Web Analytics (cookie-less) |
| Package manager | pnpm 10 |

No CMS, no submodule, no runtime fetch from upstream — content lives as markdown in this repo.

## Project layout

```
src/
├── pages/              # File-based routes (.astro, .md, .ts for endpoints)
├── content/            # Astro content collections (statement, future: article)
├── layouts/            # Shared HTML shells
├── components/         # Reusable Astro components
├── styles/globals.css  # Tailwind v4 entry (@import "tailwindcss";)
└── env.d.ts            # App.Locals typed against Cloudflare Env

plans/                  # Phased implementation plans (carved from PRDs)
docs/                   # Authoritative design docs (disclosure policy, schema)
```

Path alias `@/*` → `src/*`.

## Architecture

Three deep modules carry the system. Each has a small public interface and is tested at its boundary.

| Module | Interface | Hidden implementation |
|--------|-----------|----------------------|
| **Content Schema** | Zod-validated frontmatter for `statement` (and future `article`) collections | The cross-repo contract. Producer-side validation, schema version marker, breaking-change discipline |
| **Dual-Format Serving** | Any content entry resolves at both `/<collection>/<slug>` (HTML) and `/<collection>/<slug>.md` (`text/markdown`) | Single helper + catch-all route; no per-route boilerplate when collections grow |
| **Feed Generators** | `rss.xml`, `llms.txt`, `sitemap.xml` derived from content collections | Format renderers hidden; snapshot-tested for determinism |

See [`.claude/rules/deep-modules.md`](.claude/rules/deep-modules.md) and the architectural decisions in [`plans/ogsfrompoly-lp.md`](plans/ogsfrompoly-lp.md).

## Brand reference

Voice and aesthetic anchor: [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/). Bold display type, terminal/install-snippet moments, opinionated function-forward copy. The brand name `ogsfrompoly` is retained as owned cheekiness — a credibility signal for the prediction-market-native audience.

## Verification gate

Before declaring any change done, run all four:

```bash
pnpm types        # astro check + tsc --noEmit
pnpm test         # vitest
pnpm lint         # biome
pnpm knip         # no unused files / deps / exports
```

The same four are required by CI on every PR (see issue [#5](https://github.com/auditmos/ogsfrompoly-lp/issues/5)).

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm build` | Production build to `./dist` |
| `pnpm preview` | Preview the production build locally |
| `pnpm deploy` | Build + `wrangler deploy` |
| `pnpm cf-typegen` | Regenerate `Env` types from `wrangler.jsonc` |
| `pnpm test` / `:watch` / `:coverage` | Vitest |
| `pnpm types` | astro check + tsc --noEmit |
| `pnpm lint` / `:fix` | Biome check / auto-fix |
| `pnpm knip` | Unused files / deps / exports |
| `pnpm deps` / `:update` | Check / apply dependency updates via taze |
| `pnpm release` | semantic-release (CI only) |

## Cloudflare specifics

- Use `wrangler.jsonc` (not `.toml`).
- `custom_domain: true` on the route (never routes-with-zone_name) — see [`.claude/rules/cloudflare-deployment.md`](.claude/rules/cloudflare-deployment.md).
- SSL/TLS mode must be Full or Full (strict), never Flexible.
- HTTP → HTTPS via the "Always Use HTTPS" toggle, never the "Redirect from HTTP to HTTPS" rule (causes self-redirect loops on Worker custom domains).
- Access bindings via `import { env } from "cloudflare:workers"` — `Astro.locals.runtime` was removed in Astro v6.
- Per-env secrets live in `.dev.vars` / `.dev.vars.staging` / `.dev.vars.production` locally (never committed; wrangler loads `.dev.vars.<env>` ahead of `.dev.vars` when `CLOUDFLARE_ENV=<env>` is set) and as Cloudflare secrets in production.

## Agent-assisted development

- [`AGENTS.md`](AGENTS.md) (symlinked as `CLAUDE.md`) — project-wide agent guide
- [`.claude/rules/`](./.claude/rules/) — topic rules that activate based on the files being touched
- [`.claude/agents/`](./.claude/agents/) — design-doc writer / implementer / MVP enforcer

## License

ISC — see [LICENSE](LICENSE).
