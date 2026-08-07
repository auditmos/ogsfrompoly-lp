---
schema_version: 1
type: monthly
draft: false
title: July 2026
summary: ogsfrompoly monthly statement — 612 alerts, hit rate 0.51 (80 markets resolved
  in this period).
period_start: '2026-07-01'
period_end: '2026-07-31'
bankroll_usd: 10000.0
alert_count: 612
hit_rate: 0.5125
resolved_count: 80
hypothetical_pnl_usd: 850.1100000000004
categories:
- macro-finance
top_wallets:
- truncated_id: wallet_83f9
  category: macro-finance
  hypothetical_pnl_usd: -41.099999999999994
- truncated_id: wallet_0f59
  category: macro-finance
  hypothetical_pnl_usd: -85.95
- truncated_id: wallet_5abe
  category: macro-finance
  hypothetical_pnl_usd: 8.499999999999996
pnl:
  revenue_usd: 0.0
  opex_usd: 50.0
  net_usd: -50.0
  runway_months: 6
---

## Strategy track record (2026-07-01 → 2026-07-31)

Generated from ogsfrompoly warehouse for the monthly window 2026-07-01 → 2026-07-31. 612 alerts emitted in this window across the LP-public category (macro-finance). Numbers in the frontmatter are mechanically derived.

Top wallets are ranked by realized PnL magnitude. A wallet-level `hypothetical_pnl_usd`, when present, is the $100-notional alert-model PnL for that wallet in this same window; it is an annotation, not the ranking key.

## Project P&L

Revenue was **$0** for 2026-07-01 → 2026-07-31. Operating expenses were **$50** (aggregate ledger total; no line-item breakdown was supplied). Net was **-$50** — the first month the project runs a burn, as the standing $50/mo polynode charge begins and the copytrading pool has not yet swept realized revenue to the collection wallet. **Runway is 6 months**: the cash reserve earmarked for opex covers six months of that burn at the current rate. That reserve is an operator ledger figure, distinct from both the $10,000 hypothetical bankroll the strategy track record references and the copytrading pool's own capital base.

## Methodology reminder

See [/methodology](/methodology) for the sign-randomization skill test and the disclosure policy. All wallet references on this page are truncated IDs; no on-chain lookup is possible from this page alone.

The hit rate scores the markets that **resolved** during this period, whenever they were alerted. Statements published before 2026-07-31 scored the alerts *emitted* in the period instead, so the two series are **not comparable** and should not be read as one track record.
