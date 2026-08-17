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
		"How ogsfrompoly separates skill from luck on Polymarket. How it scores past alerts. How it decides what is safe to publish.",
	note: "This page is a translation. If anything differs, the English original wins, including its disclosure policy.",
	sections: {
		intro: `ogsfrompoly asks a narrow question:

> **Which Polymarket wallets still look skilled once you strip the luck out —
> and do their moves keep working when we score them later?**

We publish the answer after the fact, as a scorecard. We publish no live trade
ideas, no open positions, no wallet leaderboards.`,
		scope: `## Current scope

The public track record covers one Polymarket area:

- **Macro/Finance** - macro, rates, economic data, FOMC, earnings, and
  finance-labeled Polymarket markets.

The narrowness is on purpose. We do not chase category coverage. We build a
clean audit trail: skilled wallets, alerts scored after the fact, and outcomes
a reader can check later.`,
		qualify: `## How a wallet qualifies

A wallet needs enough resolved history to test. An **event** here means one
real-world question that Polymarket settles. One question can carry many
markets, outcomes, fills, or single token positions, and it still counts once.
The bar is at least 20 events resolved inside the measurement period.

Only resolved markets count. We ignore open positions. For each eligible wallet
we build an **only-realized PnL** series: one profit-and-loss number per
resolved event.

We group at the event level because one prediction can span many fills or
markets. Count each fill as its own decision and one position starts to look
like a dozen independent bets. Grouping keeps the test on the thing we care
about: did this wallet pick the right side, again and again, on questions that
have already settled?`,
		skillTest: `## The skill test

We measure skill with an event-level **sign-randomization** test.

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

"If this wallet were just guessing, how often would random sign flips match or
beat its actual total?"

We call a wallet skilled only when that p-value clears the pre-registered
threshold: \`p <= 0.05\`. A big raw PnL number is not enough.`,
		controls: `## Controls before publication

The public scorecard measures repeatable trader signal. It must not measure
address shuffling or artifacts of market microstructure.

Before a wallet reaches the published record, we screen it. We look for wallets
moving as one coordinated pack, for the same counterparty on the other side
again and again, and for trades that look like wash trades. A signal that fails
gets cut or demoted.`,
		scoring: `## How we score alerts

Weekly statements score the period after the fact. They report:

- total alerts
- resolved hit rate
- hypothetical PnL
- category mix
- a small set of opaque wallet IDs when useful for auditability

Monthly statements add the business side of the project: revenue, operating
expense, net result, and runway.

The published category is **macro-finance**. Anything outside the public scope
drops off the statement pages. We never merge it into another category.

Every statement looks back. We publish whether past signals worked. We publish
nothing about a trade in flight.`,
		skin: `## Skin in the game: two small live agents

The scorecard looks back. The money does not. Two agents trade live behind our
own signals, on tiny **$5** tickets:

- **Cluster copy** (live since July 2026) buys only when several skilled
  wallets land on the same side of the same market at once, in separate
  trades.
- **Wallet copy** (live since August 2026) mirrors two individual wallets from
  the skilled roster, each published only under an opaque label.

We document both in plain English at [copy trading for dummies](/for-dummies):
every rule, every live setting, and a simulator you can drag. Their realized
results reach the monthly statements as cash. We sweep profit to a collection
wallet each week and count it as revenue once it lands. We publish nothing
about an agent position while that position is open.`,
		academicIntro: `## Academic foundation

The methodology rests on two 2026 papers about skill, trader persistence, and
outcomes in prediction markets:`,
		academicOutro: `Both papers point at the same lesson. Short-term realized PnL is a weak proxy
for skill. A wallet can get lucky. A lucky wallet can stop winning.

So ogsfrompoly starts with a statistical skill test. Then it publishes, in the
open track record, whether those signals worked.`,
		disclosure: `## Disclosure policy

We are open about methodology and aggregate results. We are closed about
anything that could front-run a position or expose a single trader.

These rules apply to the rendered HTML page, the raw \`.md\` feed, RSS, and
\`llms.txt\`.

- **Wallets appear only as truncated, opaque IDs** — e.g. \`wallet_a3f8\`. We
  never publish a full EVM address. Truncated IDs do not reverse to an
  on-chain identity, by design.
- **No live alpha. Ever.** We never publish a live alert, a still-open
  position, or anything a reader could use to front-run a trade in flight. We
  publish results after the fact, in aggregate.
- **No leaderboards.** We never rank named wallets against each other. We
  publish the strategy cohort, not the address.
- **No raw warehouse exports.** Aggregate counts, hit rates, and category
  distributions only — never anything that could reconstruct an individual
  wallet's history.
- **No agent or leader addresses.** The live copy agents trade from their own
  wallets. Watch those wallets in real time and you see our open positions. So
  we never publish their trading accounts, their payout addresses, or the
  leader wallets they mirror. Leaders appear only as opaque labels (e.g.
  \`leader-a\`). We never name the market of an open agent position.

When a published number sits close to the line, we delay it 30+ days or
anonymize the category. When in doubt, we don't publish.`,
		notThis: `## What this is not

ogsfrompoly is not an investment recommendation, trading signal service, or
claim that any wallet will keep winning.

It is an audit trail for one method. Find wallets whose resolved history does
not look like random signs. Score their alerts after the fact, in the
categories we publish. Show the results.`,
	},
};
