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

### Narrowing log

Constraints that only reject input which was **already invalid** — i.e. no
legitimate producer could ever have emitted it — are *not* breaking and do
**not** bump `SCHEMA_VERSION`. They are recorded here so the upstream
`poly-track` producer can confirm it never relied on the accidental leniency.

- **2026-07 (issue [#33](https://github.com/auditmos/ogsfrompoly-lp/issues/33), `SCHEMA_VERSION` stays `1`):**
  - `period_start` / `period_end` must now name a **real calendar day**. The
    regex `\d{4}-\d{2}-\d{2}` alone accepted impossible dates (`2026-02-31`,
    `2026-13-01`, `2026-00-00`), which rendered `undefined 2026` labels and
    silently shifted RSS `pubDate`s. The schema round-trips the components
    through `Date.UTC` and rejects any that do not survive.
  - `categories` must not contain **duplicate** entries (`["politics","politics"]`
    previously passed).
  - Upstream note: this is a pure narrowing of previously-garbage input. No
    coordinated bump is required; poly-track must only ensure it emits real
    dates and de-duplicated category lists (it already does both).

## Top-level fields (all statements)

| Field                  | Type                                     | Notes                                                          |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `schema_version`       | `1` (literal number)                     | Bump on breaking change. See above.                            |
| `type`                 | `"weekly"` \| `"monthly"`                | Discriminates the union.                                       |
| `title`                | string, ≥ 1 char                         | Render in `<h1>` and feed `<title>`.                           |
| `summary`              | string, ≥ 1 char                         | Teaser for homepage card, RSS, `llms.txt`.                     |
| `period_start`         | ISO date `YYYY-MM-DD`                    | Inclusive. Must be a **real calendar day** (see below).        |
| `period_end`           | ISO date `YYYY-MM-DD`                    | Inclusive. Must be ≥ `period_start`. Must be a **real calendar day**. |
| `bankroll_usd`         | number, > 0                              | All `*_pnl_usd` claims reference this single bankroll.         |
| `alert_count`          | non-negative integer                     | Total alerts emitted in the period.                            |
| `hit_rate`             | number in `[0, 1]`                       | Fraction. `0.58` means 58 %. Not interpretable without `resolved_count` — see below. |
| `resolved_count`       | non-negative integer, **optional**       | How many of `alert_count` had resolved by publication: the denominator behind `hit_rate`. |
| `hypothetical_pnl_usd` | number (signed)                          | Hypothetical PnL on `bankroll_usd`.                            |
| `categories`           | non-empty array of category enum, **no duplicates** | See `Category` below.                               |
| `top_wallets`          | array of `{ truncated_id, category }`    | See `TopWallets` below.                                        |
| `draft`                | boolean, optional, defaults `false`      | When `true`, the entry is excluded from feeds, the homepage teaser, and both dual-format routes (HTML + `.md`). Used for skeletons before publication. |

### `hit_rate` and `resolved_count`

`hit_rate` is `in_favor / resolved`, over alerts **emitted** in the period. A
market that fires an alert on Monday and settles in December contributes to
`alert_count` immediately and to `hit_rate` months later.

That makes `hit_rate: 0` ambiguous on its own between two very different weeks:

| | `hit_rate` | `resolved_count` | meaning |
|---|---:|---:|---|
| genuinely bad week | `0` | `240` | 240 outcomes settled, none went our way |
| nothing settled yet | `0` | `0` | the rate is vacuous — no outcomes to score |

Macro-only statements are almost always the second case, because those markets
resolve months after the alert. Publishing a bare `0.00` for one of them reads as
a 0 % success rate, which is why `2026-07-28-weekly.md` was unpublished
(auditmos/ogsfrompoly#236).

`resolved_count` is optional because every statement published before it existed
omits it — adding an optional field is deliberately **not** a version bump, per
the rules above. Absent means *unknown*, never zero: the sanity lint
(`statement-sanity.ts`) keeps flagging `hit_rate: 0` with positive PnL when the
field is missing, so adding it does not retire that check for the back catalogue.
Producers should emit it on every new statement.

## Weekly-only

Weekly statements add no extra top-level fields beyond the shared set.

## Monthly-only

| Field | Type | Notes |
| --- | --- | --- |
| `pnl` | `{ revenue_usd, opex_usd, net_usd, runway_months }` | Project P&L for the period. `runway_months` is `number \| null` (null = revenue covers opex). |

### Monthly P&L invariants (consumer-side lint, `statement-sanity.ts`)

These are enforced at flip-time over **published** (non-draft) statements — they are *not* in the Zod contract, so they never force a `SCHEMA_VERSION` bump:

- **Balance:** `net_usd == revenue_usd - opex_usd`. `opex_usd` is a **positive magnitude**.
- **Recurring-opex floor:** from `period_start >= 2026-07-01`, `opex_usd >= 50` (`RECURRING_MONTHLY_OPEX_USD` — the standing ogsfrompoly polynode, $50/mo, cash-basis). This keeps the recurring cost in every month's numbers by construction rather than by memory. Pre-July months (genuinely $0 opex) are exempt. Raise the floor here if standing costs change.
- **Revenue** is realized only — the value swept from the copytrading pool to the collection wallet during the period, booked to the operator ledger (not the trading warehouse, not open-position marks).
- **Runway agrees with net:** `runway_months: null` renders "covered" and is valid only when `net_usd >= 0`; a net burn (`net_usd < 0`) requires a finite, **positive** `runway_months` against the opex reserve (an operator judgment, distinct from `bankroll_usd`).

> **Disclosure:** the copytrading execution and collection wallet addresses must **never** appear in any statement — not frontmatter, body, `.md`, RSS, or `llms.txt`. The corpus lint rejects any raw `0x…` hex token (full or truncated); the only sanctioned wallet reference is a `wallet_XXXX` truncated ID.

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
