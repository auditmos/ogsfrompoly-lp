/**
 * Canonical English strings for the cluster simulator's decisions, keyed for
 * the Translation Catalog under `cluster.sim` (issue #73). `evaluateSignal`
 * stays the single source of truth for the decision itself — these templates
 * only parameterize what it says. Every `{placeholder}` is filled by the
 * simulator with an already-formatted value (locale formatters own the
 * numbers), so translations can reorder words but never change a decision.
 *
 * Filled with the English formatters these templates reproduce the pre-i18n
 * output byte-for-byte — including the historical "1 of these wallet"
 * singular, preserved via the plural forms on `becauseTooMany`.
 */

import type { PluralTemplates } from "../sim-units-en";

// Type aliases (not interfaces) so the shapes get TypeScript's implicit index
// signature and stay assignable to the catalog's ProseNode.
export type ClusterSimStrings = {
	gates: {
		crowd: { question: string; because: string };
		room: { question: string; actual: string; because: string };
		liquidity: { question: string; because: string };
		timing: { question: string; because: string };
		freshness: { question: string; rulePctOnly: string; ruleWithFloor: string; because: string };
		reversal: {
			question: string;
			actualNone: string;
			actualSome: string;
			rule: string;
			when: string;
			becauseTooMany: PluralTemplates;
			becauseTooFew: string;
		};
		price: { question: string; because: string };
		fee: { question: string; because: string };
		floor: { question: string; because: string };
		fill: { question: string; actual: string; because: string };
		size: { question: string; because: string };
	};
	drift: { favour: string };
	verdict: { buy: string; skip: string; noSignal: string };
	detail: { order: string; buy: string; buyMirror: string };
	signal: { leadBought: string; leadSold: string; trailBought: string; trailSold: string };
	summary: { sentence: string; priceCapOnly: string; priceBand: string };
};

export const CLUSTER_SIM_EN: ClusterSimStrings = {
	gates: {
		crowd: {
			question: "Is a crowd agreeing, not just one trader?",
			because:
				"Only {wallets} traded it, under the {threshold} it takes to be a crowd — so no alert fires, the executor never sees it, and nothing gets recorded.",
		},
		room: {
			question: "Do I have room under my cap?",
			actual: "{open} open + {size}",
			because: "{open} is already open; another {size} ticket would breach the {cap} cap.",
		},
		liquidity: {
			question: "Is there anyone here to trade with?",
			because:
				"{liquidity} of liquidity is under the {floor} floor — easy to get in, hard to get out.",
		},
		timing: {
			question: "Is this market about to end?",
			because: "{left} left before resolution, under the {min} minimum — no room to get back out.",
		},
		freshness: {
			question: "Has the price already run away?",
			rulePctOnly: "≤ {pct}",
			ruleWithFloor: "≤ {pct} or < {steps}",
			because:
				"The price moved {drift} against us ({entry} → {live}), past the {limit} limit and past the {floor} noise floor — the move already happened.",
		},
		reversal: {
			question: "Were any of them just on the other side?",
			actualNone: "none flipped",
			actualSome: "{flipped} of {total}, {ago} ago",
			rule: "≤ {tolerated} within {window}",
			when: "{ago} ago, inside the {window} window",
			becauseTooMany: {
				one: "{n} of these wallet held the opposite view of this market {when} — they are not a crowd agreeing, they are a wallet changing its mind in public.",
				few: "{n} of these wallets held the opposite view of this market {when} — they are not a crowd agreeing, they are a wallet changing its mind in public.",
				many: "{n} of these wallets held the opposite view of this market {when} — they are not a crowd agreeing, they are a wallet changing its mind in public.",
			},
			becauseTooFew:
				"Setting aside the {flipped} that flipped {when} leaves only {clean} — under the {threshold} it takes to be a crowd, so the flip was carrying this signal.",
		},
		price: {
			question: "Is a share too expensive to be worth the downside?",
			because:
				"A share costs {entry}, over the {ceiling} ceiling — it can win at most {gain} while still risking the whole {size}.",
		},
		fee: {
			question: "Does the fee eat too much of the ticket?",
			because:
				"Entering a {entry} outcome costs {fraction} of the ticket in fees, over the {ceiling} ceiling — the fee is charged per share, so a cheap outcome is the expensive one to trade.",
		},
		floor: {
			question: "Will this take me below my floor?",
			because: "A {size} ticket would leave {left}, under the {floor} spendable floor.",
		},
		fill: {
			question: "Can I buy inside my own price limit?",
			actual: "asks {price}",
			because:
				"The cheapest ask is {ask} and the agent's limit is {limit} — an all-or-nothing order at that limit just dies.",
		},
		size: {
			question: "Is the order big enough for the venue?",
			because:
				"{size} at a limit of {limit} buys only {shares}, and this venue refuses anything under {min}.",
		},
	},
	drift: { favour: "moved in our favour" },
	verdict: { buy: "BUY {size}", skip: "SKIP", noSignal: "NO SIGNAL" },
	detail: {
		order: "It buys {size} at a limit of {limit} — about {shares} — all-or-nothing, or not at all.",
		buy: "Every check passed. {order} It holds until the first of those wallets sells.",
		buyMirror:
			"The crowd was selling, so the agent buys the opposite outcome at {entry} instead. {order} It holds until the first of those wallets buys back what they sold.",
	},
	signal: {
		leadBought: "{wallets} bought",
		leadSold: "{wallets} sold",
		trailBought: "at {price}.",
		trailSold: "at {price} — so the agent would buy the opposite outcome at {mirror}.",
	},
	summary: {
		sentence:
			"When {threshold}+ skilled wallets agree, none of them having been on the other side of it in the last {lookback}, and the market holds at least {liquidity} of liquidity, has more than {horizon} left to run, and has not moved more than {staleness} against them → the agent buys {size} of what they bought (or of the opposite outcome, if they were selling), {priceBand} gives away no more than {fee} of the ticket in fees, does not pay more than {slippage} over the price they got, holds until the first of them reverses, keeps {floor} spendable and {gas} POL back for gas, and repeats with never more than {cap} in play at once.",
		priceCapOnly: "pays at most {max} a share,",
		priceBand: "pays between {min} and {max} a share,",
	},
};
