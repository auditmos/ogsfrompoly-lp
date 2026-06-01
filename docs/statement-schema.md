# Statement frontmatter schema (cross-repo contract)

> Source of truth: [`src/content/statement-schema.ts`](../src/content/statement-schema.ts).
> This document describes the contract; the Zod schema enforces it.
>
> **Audience:** content authors (today: human; later: upstream `poly-track` CLI).
>
> **Schema-freeze status (v1 launch, 2026-06):** frozen at `SCHEMA_VERSION = 1`.
> The cross-repo contract is stable. Any change to required-field shape must
> bump the version and be coordinated with the upstream `poly-track` CLI before
> producer-side automation lands (Phase 4 / v2).

This schema is the **stable interface** between this repo and any producer of
statement content. Changing it is a breaking change for downstream automation.
See PRD #1 "Implementation Decisions → Content Schema" and `plans/ogsfrompoly-lp.md`
"Architectural decisions → Content schema = cross-repo contract".

## Versioning

Every entry MUST declare `schema_version: 1` at the top of frontmatter.

The schema module exports `SCHEMA_VERSION` as a single source of truth:

```ts
import { SCHEMA_VERSION } from "@/content/statement-schema"; // === 1
```

- Adding an optional field with a default: **not** a version bump (e.g. the
  `draft` field added in v1 launch).
- Adding a required field, removing a field, narrowing a type, tightening a
  constraint: **breaking**. Bump `SCHEMA_VERSION` to `2` and accept both
  during a transition window.
- The schema source file's `z.literal(SCHEMA_VERSION)` is what CI enforces;
  the test in `statement-schema.test.ts` guards against drift.
- Breaking changes require a coordinated PR against the upstream `poly-track`
  repo (which holds the producer-side CLI) before the bump can merge.

## Top-level fields (all statements)

| Field                  | Type                                     | Notes                                                          |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `schema_version`       | `1` (literal number)                     | Bump on breaking change. See above.                            |
| `type`                 | `"weekly"` \| `"monthly"`                | Discriminates the union.                                       |
| `title`                | string, ≥ 1 char                         | Render in `<h1>` and feed `<title>`.                           |
| `summary`              | string, ≥ 1 char                         | Teaser for homepage card, RSS, `llms.txt`.                     |
| `period_start`         | ISO date `YYYY-MM-DD`                    | Inclusive.                                                     |
| `period_end`           | ISO date `YYYY-MM-DD`                    | Inclusive. Must be ≥ `period_start`.                           |
| `bankroll_usd`         | number, > 0                              | All `*_pnl_usd` claims reference this single bankroll.         |
| `alert_count`          | non-negative integer                     | Total alerts emitted in the period.                            |
| `hit_rate`             | number in `[0, 1]`                       | Fraction. `0.58` means 58 %.                                   |
| `hypothetical_pnl_usd` | number (signed)                          | Hypothetical PnL on `bankroll_usd`.                            |
| `categories`           | non-empty array of category enum         | See `Category` below.                                          |
| `top_wallets`          | array of `{ truncated_id, category }`    | See `TopWallets` below.                                        |
| `draft`                | boolean, optional, defaults `false`      | When `true`, the entry is excluded from feeds, the homepage teaser, and both dual-format routes (HTML + `.md`). Used for skeletons before publication. |

## Weekly-only

Weekly statements add no extra top-level fields beyond the shared set.

## Monthly-only

| Field | Type | Notes |
| --- | --- | --- |
| `pnl` | `{ revenue_usd, opex_usd, net_usd, runway_months }` | Project P&L for the period. `runway_months` is `number \| null` (null = revenue covers opex). |

## `Category` enum

Fixed enum — adding a value is a breaking change.

- `politics`
- `macro-finance`
- `crypto`

## `TopWallets` entries

Array of `{ truncated_id: string, category: Category }`.

`truncated_id`:

- Min length 1, max length 32 characters.
- MUST NOT contain a full EVM address. The schema rejects any value matching
  `/0x[0-9a-f]{40}/i`.
- Recommended form: `wallet_<short-hex>` (e.g. `wallet_a3f8`). Producers may
  use any short opaque identifier as long as it does not allow on-chain lookup.

## Disclosure invariants enforced at schema level

- **No full wallet addresses.** The schema rejects any `truncated_id` whose
  value contains a full EVM address pattern, or any `truncated_id` longer than
  32 characters. This is the load-bearing primitive of the project's disclosure
  policy — see [`disclosure-policy`](#disclosure-policy-for-content-authors) below.

## Disclosure policy for content authors

The schema can only catch shape mistakes. Authors must also obey:

- Never publish live alerts — only retrospective, aggregate results.
- Never publish anything that could front-run a still-open position. When in
  doubt, delay 30+ days or anonymize the category.
- Never publish raw warehouse exports that could be used to reconstruct
  individual wallet histories.

See `CLAUDE.md` "site content" block for the full policy.

## Example: minimal weekly statement

```yaml
schema_version: 1
type: weekly
title: "Week of May 19, 2026"
summary: "Sign-randomization skill test on 142 alerts; aggregate hit rate 0.58."
period_start: 2026-05-19
period_end: 2026-05-25
bankroll_usd: 10000
alert_count: 142
hit_rate: 0.58
hypothetical_pnl_usd: 412.5
categories: [politics, macro-finance]
top_wallets:
  - { truncated_id: wallet_a3f8, category: politics }
  - { truncated_id: wallet_c12e, category: macro-finance }
```

## Example: minimal monthly statement

```yaml
schema_version: 1
type: monthly
title: "May 2026"
summary: "Aggregate hit rate 0.55 across 612 alerts; project P&L attached."
period_start: 2026-05-01
period_end: 2026-05-31
bankroll_usd: 10000
alert_count: 612
hit_rate: 0.55
hypothetical_pnl_usd: 1240.75
categories: [politics, macro-finance, crypto]
top_wallets:
  - { truncated_id: wallet_a3f8, category: politics }
pnl:
  revenue_usd: 0
  opex_usd: 480
  net_usd: -480
  runway_months: 18
```
