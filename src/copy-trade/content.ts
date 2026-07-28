/**
 * Reader-facing prose for `/for-dummies`.
 *
 * Split into three markdown blocks so the HTML page can slot the interactive
 * simulator between them, while `copyTradeMarkdown` stitches the same prose into
 * one self-contained document for the `.md` twin — with a generated knob table
 * standing in for the sliders, so the two surfaces can never disagree about a
 * default.
 */

import { CONFIG_AS_OF, CONFIG_MARKET, formatKnobValue, KNOBS, LIVE_CONFIG } from "./config";
import { summarySentence } from "./simulator";

export const copyTradeTitle = "Copy trade for dummies";
export const copyTradeDescription =
	"Plain-English walkthrough of the ogsfrompoly copy-trade bot — when it buys, when it skips, when it sells, and which numbers you can actually turn.";

export const copyTradeIntroMarkdown = `# ${copyTradeTitle}

${copyTradeDescription}

Alongside the published track record, a small bot mirrors the wallets our skill
test flags. This page is the whole mechanism in plain language: what it does,
step by step, and which numbers are knobs versus rules welded into the code.

Think of it as a **very cautious impersonator** standing in the market, watching
traders who have already proven themselves. It is deliberately timid — the
position sizes below are tiny on purpose, because the point of the first live
run is to be correct, not to be big.

Every number on this page is the live setting for the **${CONFIG_MARKET}** market
as of **${CONFIG_AS_OF}**, read from \`config/copy_trade.yml\`.
`;

export const copyTradeStoryMarkdown = `## The whole story, one step at a time

### 1. It listens for a crowd, never for one trader

It does not move because a single wallet bought something. Only when at least
**3 skilled wallets** buy the same thing at once (\`cluster_threshold\`) does it
say: that is a quorum, worth a look.

### 2. Three safety checks before it will buy anything

- **“Is there anyone here to trade with?”** — if the market holds less than
  **$1,000** of liquidity (\`min_liquidity_usdc\`), it skips. Getting in is easy;
  getting out of a thin market is the part that hurts.
- **“Is this market about to end?”** — if less than **1 hour** remains before
  resolution (\`min_seconds_to_resolution\`), it skips.
- **“Has the price already run?”** — if the price moved more than **3%** since
  the skilled wallets bought (\`staleness_pct\`), it skips. The move already
  happened; buying now is paying for someone else's edge.

### 3. It checks its own wallet

*“Do I have room?”* — it holds at most **$5** open at any one moment
(\`exposure_cap_usdc\`).

*“Will this take me too low?”* — it never trades if the balance would drop below
**$20** (\`working_capital_floor_usdc\`).

It also parks **2 POL** (\`gas_reserve_pol\`) for network gas, so it can always
afford the exits it still owes.

### 4. It buys small, and refuses to overpay

If everything lines up, it buys **$1** (\`trade_size_usdc\`) at market — with a
brake on it. It will not pay more than **1%** over fair price
(\`slippage_pct\`). If the order book demands more, it walks away.

### 5. It holds, and runs at the first sign of an exit

Then it watches the same skilled wallets. When the **first one of them sells**,
the bot sells too, immediately. It does not wait for the others to agree and it
does not sit around for the market to resolve. Riding to resolution is only the
fallback, for when nobody sold first.

*This one is hard-wired. There is no setting for it.*

### 6. It goes around again

Sold, dollar back, room free, next signal. All day — but never more than **$5**
in play at once.

### 7. Once a week it sweeps the profit

It counts what it actually made, after fees and gas. A green week sends the
surplus above the **$20** floor to the payout address (\`profit_destination\`) —
but only if that address is on the allowlist (\`destination_allowlist\`, the
safety catch) and only if the amount clears the **$1** dust threshold
(\`dust_threshold_usdc\`). A red week pays out nothing at all. The first payout
ever made needs a human to say yes.

### 8. The big red button

At any moment the kill switch (\`kill_switch\`) stops the bot **buying** anything
new — while it keeps watching and closing whatever is already open. It stops
taking risk; it does not abandon it.
`;

export const copyTradeClosingMarkdown = `## What is hard-wired, and not a setting

- **“First skilled wallet sells → we are out.”** Fixed logic: first-sell, with
  resolution as the backstop. There is no take-profit and no stop-loss to tune.
- **One position per crowd.** The bot never stacks several bets on the same
  cluster of wallets.
- **Entry is a marketable order on quorum.** *How* it enters is fixed. You only
  tune the thresholds around it — slippage, staleness, liquidity.

**Why split it that way?** How much, when to skip, how much at once, how much to
leave behind — all of that is a number, and numbers are safe to expose. How it
buys and when it sells — the entire copying logic — lives in code, so that one
careless line of YAML cannot quietly derail the strategy.

## What this page is not

These are operating parameters for our own small bot, published in the same
spirit as the rest of the track record. They are not advice, not a signal
service, and not a claim that mirroring skilled wallets will keep working.

The bot's wallet addresses are never published anywhere on this site — watching
the execution wallet in real time would expose open positions, which is exactly
what the [disclosure policy](/methodology) exists to prevent.
`;

/**
 * The knob table that replaces the interactive panel on the `.md` surface.
 * Generated from {@link KNOBS} so an added knob cannot go missing here.
 */
function renderKnobTable(): string {
	const rows = KNOBS.map(
		(knob) =>
			`| ${knob.label} | \`${knob.key}\` | ${formatKnobValue(knob.unit, LIVE_CONFIG[knob.key])} |`,
	);
	return [
		"| Role in the story | Key | Live (Macro) |",
		"|---|---|---|",
		...rows,
		"| Payout address, allowlist, dust threshold | `profit_destination`, `destination_allowlist`, `dust_threshold_usdc` | not published |",
		"| Stop everything | `kill_switch` | — |",
	].join("\n");
}

export const copyTradeMarkdown = `${copyTradeIntroMarkdown}
## In one sentence

> ${summarySentence(LIVE_CONFIG)}

## The knobs

The site renders these as sliders you can drag to watch the bot's decision flip.
In markdown they are just the table:

${renderKnobTable()}

${copyTradeStoryMarkdown}
${copyTradeClosingMarkdown}`;
