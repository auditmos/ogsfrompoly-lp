---
schema_version: 1
type: monthly
draft: true
title: "May 2026"
summary: "TODO: one-line teaser — N alerts, hit rate X.XX, project P&L attached."
period_start: 2026-05-01
period_end: 2026-05-31
# TODO: confirm bankroll size for the monthly view (may differ from weekly).
bankroll_usd: 10000
# TODO: total alerts for the month — sum of weekly counts.
alert_count: 0
# TODO: monthly aggregate hit rate (not the average of weekly rates).
hit_rate: 0
# TODO: signed USD; hypothetical monthly PnL on bankroll_usd above.
hypothetical_pnl_usd: 0
categories:
  - politics
  - macro-finance
  - crypto
top_wallets:
  - truncated_id: wallet_TODO1
    category: politics
  - truncated_id: wallet_TODO2
    category: macro-finance
  - truncated_id: wallet_TODO3
    category: crypto
# TODO: project P&L section. Be honest: revenue is likely 0 for the first
# month — say so explicitly.
pnl:
  revenue_usd: 0
  # TODO: itemize opex in the prose below. Sum here.
  # Known recurring line items: Hostinger KVM, domain registrar, any APIs.
  opex_usd: 0
  net_usd: 0
  # TODO: months of runway at current burn. Use `null` if revenue covers opex.
  runway_months: null
---

<!--
DRAFT — flip `draft: false` and remove this comment block when ready to publish.

Required before publishing (issue #10 AC):
- Real numbers including a real opex line-item breakdown in prose
- If revenue == 0, say so explicitly — the open-book promise demands it
- Runway commentary should be honest about current burn vs cash on hand
-->

## Strategy track record (May 2026)

TODO: 1–2 paragraphs summarising the month's strategy performance. Same shape
as the weekly statement but at monthly aggregation.

## Project P&L

### Revenue

TODO: state revenue line by line. If $0, say "No revenue this month — the
project monetises later via paid acquirer conversations, not now."

### Operating expenses

TODO: itemise opex line by line. Example structure:

- Hostinger KVM (compute): $XX
- Domain registrar (`ogsfrompoly.com`): $XX
- Other: $XX

Sum should match the `opex_usd` field in frontmatter.

### Runway

TODO: 1 paragraph. Current cash on hand, monthly burn, months remaining.
If revenue covers opex, set `runway_months: null` and explain.

## Methodology reminder

See [/methodology](/methodology) for the skill test and the disclosure policy.
All wallet references are truncated IDs only.
