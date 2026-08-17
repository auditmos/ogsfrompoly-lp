/**
 * Canonical English prose for the methodology page, split into section-level
 * keys for the Translation Catalog (issue #71) — one key per heading/section,
 * exactly as agreed in the i18n plan. The stitcher in content.ts joins these
 * back into the page markdown; the English output is byte-identical to the
 * pre-split literal. The citation block is deliberately NOT a key — citations
 * are never translated and are stitched in between the two academic keys.
 */

// A type alias (not an interface) so the shape gets TypeScript's implicit
// index signature and stays assignable to the catalog's ProseNode.
export type MethodologyProse = {
	title: string;
	description: string;
	/**
	 * The one-sentence "the English original is authoritative" note. Registered
	 * as a catalog key like any other, but rendered only on translated surfaces
	 * — the English page never shows it.
	 */
	note: string;
	sections: {
		intro: string;
		scope: string;
		qualify: string;
		skillTest: string;
		controls: string;
		scoring: string;
		skin: string;
		academicIntro: string;
		academicOutro: string;
		disclosure: string;
		notThis: string;
	};
};

export const METHODOLOGY_EN: MethodologyProse = {
	title: "Methodology",
	description:
		"How ogsfrompoly tests Polymarket wallets for repeatable skill, scores retrospective alerts, and decides what is safe to publish.",
	note: "This page is a translation of the English original — if anything differs, the English version, including its disclosure policy, is authoritative.",
	sections: {
		intro: `ogsfrompoly asks a narrow question:

> **Which Polymarket wallets look skilled after luck is stripped out, and do
> their moves keep working when we score them later?**

The answer is published as a retrospective scorecard. We do not publish live
trade ideas, open-position details, or wallet leaderboards.`,
		scope: `## Current scope

The public track record currently covers a single Polymarket area:

- **Macro/Finance** - macro, rates, economic data, FOMC, earnings, and
  finance-labeled Polymarket markets.

This narrow scope is deliberate. The goal is not broad category coverage.
The goal is a clean audit trail: skilled wallets, retrospective alerts, and
published outcomes that a reader can check later.`,
		qualify: `## How a wallet qualifies

A wallet first needs enough resolved history to test. Here, an **event** means
one real-world question being settled on Polymarket, even if that question has
multiple markets, outcomes, fills, or token legs. The minimum is at least
20 events that have resolved within the measurement period.

Only resolved markets count. Open positions are ignored. For each eligible
wallet, we build an **only-realized PnL** series: one profit-and-loss value per
resolved real-world event.

We group at the event level because one real-world prediction can involve
multiple fills or market legs. Counting each fill as a separate decision would
make one position look like many independent bets. Counting at the event level
keeps the test closer to the thing we care about: whether the wallet repeatedly
picked the right side of resolved Polymarket events.`,
		skillTest: `## The skill test

Skill is measured with an event-level **sign-randomization** test.

For each eligible wallet, the inputs are:

- \`n\` = number of resolved events for the wallet.
- \`x_i\` = the wallet's realized PnL on event \`i\`.
- \`A = sum(x_i)\` = the wallet's actual total realized PnL.
- \`B = 1,000 simulations\` = the size of the randomization run.

Each simulation keeps the size of every event result but randomizes the sign.
For simulation \`j\`, each event gets a random sign:

\`s_{j,i} in {-1, +1}\`

The simulated no-skill total is:

\`T_j = sum(s_{j,i} * abs(x_i))\`

The p-value is:

\`p = count(T_j >= A) / B\`

In words, the p-value answers:

"If this wallet had no skill, how often would random sign flips produce a total
PnL at least as good as the wallet's actual total?"

A wallet is treated as skilled only when that p-value clears the
pre-registered threshold: \`p <= 0.05\`. A large raw PnL number is not enough.`,
		controls: `## Controls before publication

The public scorecard should measure repeatable trader signal, not address
management or market microstructure artifacts.

Before a wallet can affect the published record, the pipeline applies controls
for coordinated multi-wallet clusters, concentrated counterparty patterns, and
wash-like behavior. These controls either remove or demote signals that can
make one address look more skilled than it really is.`,
		scoring: `## How alerts are scored

Weekly statements score the period after the fact. They report:

- total alerts
- resolved hit rate
- hypothetical PnL
- category mix
- a small set of opaque wallet IDs when useful for auditability

Monthly statements add the business side of the project: revenue, operating
expense, net result, and runway.

The published category is **macro-finance**. Anything outside the current
public scope is dropped from the landing-page statement surface instead of
being merged into another category.

Every statement is retrospective. The site publishes whether historical
signals worked. It does not publish instructions for trades in flight.`,
		skin: `## Skin in the game: two small live bots

The scorecard is retrospective, but the project also puts a small amount of
real money behind its own signals. Two bots trade live, with deliberately tiny
**$5** tickets:

- **Cluster copy** (live since July 2026) buys only when several skilled
  wallets land on the same side of the same market at once, in separate
  trades.
- **Wallet copy** (live since August 2026) mirrors two individual wallets from
  the skilled roster, each published only under an opaque label.

Both are documented in plain English — every rule, every live setting, and a
simulator you can drag — at [copy trading for dummies](/for-dummies). Their
realized results reach the monthly statements as cash: profit is swept weekly
to a collection wallet and counted as revenue only once it lands there.
Nothing about a bot position is published while that position is open.`,
		academicIntro: `## Academic foundation

The methodology is grounded in two 2026 papers on prediction-market skill,
trader persistence, and market outcomes:`,
		academicOutro: `Both papers point to a practical lesson: short-term realized PnL is a weak
proxy for skill. A wallet can get lucky, and a lucky wallet can stop winning.

That is why ogsfrompoly starts with a statistical skill test, then publishes
whether the resulting signals actually worked in the public track record.`,
		disclosure: `## Disclosure policy

The site is open about methodology and aggregate results. It is closed about
anything that could front-run a position or expose an individual trader's
identity.

These rules apply to the rendered HTML page, the raw \`.md\` feed, RSS, and
\`llms.txt\`.

- **Wallets appear only as truncated, opaque IDs** — e.g. \`wallet_a3f8\`. We
  never publish a full EVM address. Truncated IDs are deliberately not
  reversible to on-chain identities.
- **No live alpha. Ever.** We never publish a live alert, a still-open
  position, or anything a reader could use to front-run a trade in flight.
  Results are retrospective and aggregate only.
- **No leaderboards.** We do not rank named wallets against each other. The
  unit of publication is the strategy cohort, not the individual address.
- **No raw warehouse exports.** Aggregate counts, hit rates, and category
  distributions only — never anything that could reconstruct an individual
  wallet's history.
- **No bot or leader addresses.** The live copy bots trade from their own
  wallets, and watching those wallets in real time would expose open
  positions — so their trading accounts, payout addresses, and the mirrored
  leader wallets are never published. Leaders appear only as opaque labels
  (e.g. \`leader-a\`), and the market of an open bot position is never named.

When a published number sits close to the line, we delay by 30+ days or
anonymize the category before publishing. When in doubt, we don't publish.`,
		notThis: `## What this is not

ogsfrompoly is not an investment recommendation, trading signal service, or
claim that any wallet will keep winning.

It is an audit trail for one specific method: find wallets whose resolved
history looks different from a sign-randomized null, follow their retrospective
alerts in the categories we publish, and show the results.`,
	},
};
