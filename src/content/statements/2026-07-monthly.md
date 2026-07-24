---
schema_version: 1
type: monthly
draft: true
title: July 2026
summary: ogsfrompoly monthly statement — DRAFT, numbers pending month close.
period_start: '2026-07-01'
period_end: '2026-07-31'
bankroll_usd: 10000.0
alert_count: 0
hit_rate: 0.0
hypothetical_pnl_usd: 0.0
categories:
- politics
- macro-finance
top_wallets: []
pnl:
  revenue_usd: 0.0
  opex_usd: 50.0
  net_usd: -50.0
  runway_months: null
---

## Strategy track record (2026-07-01 → 2026-07-31)

**DRAFT — regenerate this section from the ogsfrompoly warehouse at month close (2026-08-01).** The frontmatter above carries placeholder zeros for `alert_count`, `hit_rate`, `hypothetical_pnl_usd`, and an empty `top_wallets`; these are mechanically derived and must be filled before flipping `draft: false`.

Top wallets are ranked by realized PnL magnitude. A wallet-level `hypothetical_pnl_usd`, when present, is the $100-notional alert-model PnL for that wallet in this same window; it is an annotation, not the ranking key. Wallet IDs are truncated to their last four hex characters; no on-chain lookup is possible from this page.

## Project P&L

Revenue, opex, net, and runway are sourced from the operator's ledger (not the trading warehouse); the `pnl` block above holds the canonical numbers.

**Operating expenses** begin this month: the ogsfrompoly polynode is **$50/mo**, first charge posting in July, booked cash-basis in the month the charge lands. This is the sole line item — no other cash costs (domain, Cloudflare, data) are billed against the project ledger yet.

**Revenue** is the realized copytrading income booked to the operator ledger for the period — settled gains only, not mark-to-market on open positions. The copytrading pool went live on 2026-07-24, seeded with **100 USDC and 225 POL** and run as its own capital base — separate from both the $10,000 hypothetical bankroll the strategy track record references and the opex reserve. July therefore reflects roughly one week of activity. Revenue is measured as the value **swept from the pool to the collection wallet** during the period — not open-position marks. **DRAFT placeholder: $0** — replace with the actual swept total at month close.

**Net** is revenue minus opex. **Runway** reads `covered` (`null`) only when revenue meets or exceeds opex; otherwise it is a finite months-of-runway figure against the cash reserve earmarked for opex (distinct from the $10,000 trading bankroll the strategy claims reference). With the placeholder $0 revenue against $50 opex, net is **−$50** and runway is provisional pending the realized revenue figure and, if net stays negative, the operator's opex reserve.

## Methodology reminder

See [/methodology](/methodology) for the sign-randomization skill test and the disclosure policy. All wallet references on this page are truncated IDs; no on-chain lookup is possible from this page alone.
