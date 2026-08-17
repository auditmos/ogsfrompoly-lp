/**
 * Canonical English strings for the wallet simulator's decisions, keyed for
 * the Translation Catalog under `wallet.sim` (issue #74) — the same mechanism
 * the cluster simulator ships (issue #73), no new machinery. Every
 * `{placeholder}` is filled by the simulator with an already-formatted value;
 * `{leader}` is always the anonymous config label (`leader-a` / `leader-b`),
 * which is never translated — translations must carry it through verbatim.
 *
 * Filled with the English formatters these templates reproduce the pre-i18n
 * output byte-for-byte.
 */

import type { PluralTemplates } from "../sim-units-en";

// Type aliases (not interfaces) so the shapes get TypeScript's implicit index
// signature and stay assignable to the catalog's ProseNode.
export type WalletSimStrings = {
	gates: {
		boot: { question: string; actual: string; because: string };
		conviction: { question: string; actual: string; because: string };
		cap: { question: string; actual: string; because: PluralTemplates };
		room: { question: string; actual: string; because: string };
		liquidity: { question: string; because: string };
		timing: { question: string; because: string };
		freshness: { question: string; rulePctOnly: string; ruleWithFloor: string; because: string };
		flow: { question: string; actualNone: string; because: string };
		price: { question: string; because: string };
		floor: { question: string; because: string };
	};
	drift: { favour: string };
	verdict: { copy: string; skip: string; noSignal: string; noBoot: string };
	detail: { order: string; hold: string; copy: string; copyViaSale: string };
	signal: { lead: string; trail: string; trailViaSale: string };
	trim: {
		holdHeadline: string;
		holdDetail: string;
		closeHeadline: string;
		closeDetail: string;
	};
	summary: { sentence: string; flowAny: string; flowCapped: string };
};

export const WALLET_SIM_EN: WalletSimStrings = {
	gates: {
		boot: {
			question: "Can my ticket even buy {min} shares at the worst price I allow?",
			actual: "{size} → {shares} at {limit}",
			because:
				"A {size} ticket at the worst limit the other knobs allow ({limit}) buys under the venue's {min}-share minimum, so the service refuses to start on this config at all rather than fail one order at a time.",
		},
		conviction: {
			question: "Has {leader} bet enough to mean it?",
			actual: "{stake} at peak",
			because:
				"{leader}'s whole position on this bet peaked at {stake}, under their {bar} bar — the tracker never emits an entry signal, so the agent never gets asked and nothing gets recorded.",
		},
		cap: {
			question: "Am I already copying this leader enough?",
			actual: "{n} open for {leader}",
			because: {
				one: "{n} copy of {leader} is already open, at the per-leader cap of {cap} — one leader on a spree cannot eat the whole budget.",
				few: "{n} copies of {leader} are already open, at the per-leader cap of {cap} — one leader on a spree cannot eat the whole budget.",
				many: "{n} copies of {leader} are already open, at the per-leader cap of {cap} — one leader on a spree cannot eat the whole budget.",
			},
		},
		room: {
			question: "Do I have room under my cap?",
			actual: "{open} open + {size}",
			because:
				"{open} is already open across both leaders; another {size} copy would breach the {cap} cap.",
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
			question: "Has the price already run past the leader?",
			rulePctOnly: "≤ {pct}",
			ruleWithFloor: "≤ {pct} or < {steps}",
			because:
				"The ask sits {drift} past the leader's {entry} entry (now {ask}), beyond the {limit} limit and the {floor} noise floor — the move already happened.",
		},
		flow: {
			question: "Does this leader trade both sides of this bet?",
			actualNone: "nothing to weigh",
			because:
				"Over the last 48 hours this leader's buy and sell flow on this bet sit at {ratio} of each other, past the {ceiling} ceiling — a wallet trading both sides is making a market, not expressing a view, and every flip copied is a paid round trip.",
		},
		price: {
			question: "Is a share too expensive to be worth the downside?",
			because:
				"The market prices this outcome at {price}, over the {ceiling} ceiling — a copy could win at most {gain} while still risking the whole {size}.",
		},
		floor: {
			question: "Will this take me below my floor?",
			because: "A {size} copy would leave {left}, under the {floor} spendable floor.",
		},
	},
	drift: { favour: "moved in our favour" },
	verdict: {
		copy: "COPY {size}",
		skip: "SKIP",
		noSignal: "NO SIGNAL",
		noBoot: "REFUSED AT BOOT",
	},
	detail: {
		order:
			"It sends a {size} fill-or-kill order at a limit of {limit} — about {shares} — it fills completely or dies. A killed order gets no retry.",
		hold: "Then it holds through small trims and sells the whole leg the moment {leader} has unwound {threshold} of their peak — or flipped, or closed out.",
		copy: "Every check passed. {order} {hold}",
		copyViaSale:
			"The leader built this position by selling the other side, so the agent buys the outcome they actually hold, at {ask}. {order} {hold}",
	},
	signal: {
		lead: "{leader} built a {stake} position in",
		trail: "at {entry}.",
		trailViaSale:
			"— by selling the other side, so the outcome they actually hold trades at {entry}, and that is what the agent would buy.",
	},
	trim: {
		holdHeadline: "HOLD",
		holdDetail:
			"The leader has unwound {sold} of their peak — under the {threshold} line. That is information, not an exit: the agent writes it down and keeps the whole position.",
		closeHeadline: "CLOSE THE WHOLE LEG",
		closeDetail:
			"{sold} of the peak is gone — at or past the {threshold} line. The agent sells the entire copy at once, never a slice: a proportional sliver can drop under the venue's {min}-share minimum and become unsellable.",
	},
	summary: {
		sentence:
			"When one of the two leaders builds at least {a} (leader-a) or {b} (leader-b) of a fresh bet, {flowClause} and the market holds at least {liquidity} of liquidity, has more than {horizon} left to run, and the price has not run more than {staleness} past their entry → the agent buys {size} of the outcome they hold, pays at most {maxPrice} a share and {slippage} over the ask, runs at most {copies} copies per leader and {cap} open in total, keeps {floor} spendable, holds through small trims, and sells the whole leg once that leader has unwound {trim} of their peak — or flipped, or closed.",
		flowAny: "whatever their recent flow looks like,",
		flowCapped: "and their recent flow on it is not two-sided beyond {ratio},",
	},
};
