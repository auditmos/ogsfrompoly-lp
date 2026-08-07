import { isKnobKey, type KnobValues, LIVE_CONFIG, SCENARIOS, type Scenario } from "./config";
import { evaluateSignal, signalLine, summarySentence } from "./simulator";

// Destructuring the tuple keeps each fixture exactly typed — no array-access guard.
const [textbook, mirror, coarse, pricey, tooDear, flipped, endsSoon, thin, chased, full, broke] =
	SCENARIOS;

function withKnobs(overrides: Partial<KnobValues>): KnobValues {
	return { ...LIVE_CONFIG, ...overrides };
}

/**
 * The tracker's bar first, then the executor's own order of questions, ending
 * with the two the venue asks.
 */
const GATE_ORDER = [
	"crowd",
	"room",
	"liquidity",
	"timing",
	"freshness",
	"reversal",
	"price",
	"fee",
	"floor",
	"fill",
	"size",
];

function gate(values: KnobValues, scenario: Scenario, id: string) {
	return evaluateSignal(values, scenario).gates.find((entry) => entry.id === id);
}

describe("evaluateSignal", () => {
	it("buys the textbook signal on the live config", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, textbook);

		expect(verdict.action).toBe("buy");
		expect(verdict.headline).toBe("BUY $5");
		expect(verdict.gates.every((entry) => entry.passed)).toBe(true);
		expect(verdict.gates.some((entry) => entry.blocker)).toBe(false);
	});

	it("asks every question in pipeline order, whatever the outcome", () => {
		for (const scenario of SCENARIOS) {
			const verdict = evaluateSignal(LIVE_CONFIG, scenario);
			expect(verdict.gates.map((entry) => entry.id)).toEqual(GATE_ORDER);
		}
	});

	it("names the pipeline that enforces each check", () => {
		// The crowd threshold is the tracker's, not the executor's: `ClusterTrigger`
		// refuses to emit an alert at all below it, so the executor is never asked.
		// Everything after it is a rail the risk gate really runs.
		const stages = evaluateSignal(LIVE_CONFIG, textbook).gates.map((entry) => [
			entry.id,
			entry.stage,
		]);

		expect(stages[0]).toEqual(["crowd", "alert"]);
		expect(stages.slice(1).every(([, stage]) => stage === "executor")).toBe(true);
	});

	it("points every check at a knob the panel actually ships", () => {
		for (const entry of evaluateSignal(LIVE_CONFIG, textbook).gates) {
			expect(isKnobKey(entry.knob)).toBe(true);
		}
	});

	it.each([
		{ scenario: endsSoon, blocker: "timing" },
		{ scenario: thin, blocker: "liquidity" },
		{ scenario: chased, blocker: "freshness" },
		{ scenario: full, blocker: "room" },
		{ scenario: broke, blocker: "floor" },
		{ scenario: tooDear, blocker: "price" },
		{ scenario: flipped, blocker: "reversal" },
		{ scenario: coarse, blocker: "fee" },
	])("skips $scenario.label on the check it was written to trip", ({ scenario, blocker }) => {
		const verdict = evaluateSignal(LIVE_CONFIG, scenario);

		expect(verdict.action).toBe("skip");
		expect(verdict.headline).toBe("SKIP");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe(blocker);
	});

	it("marks only the first failing check as the blocker", () => {
		// The thin market fails liquidity, freshness, the fee AND the limit; the
		// real executor never reaches the later ones, so only liquidity may be
		// flagged.
		const verdict = evaluateSignal(LIVE_CONFIG, thin);
		const failed = verdict.gates.filter((entry) => !entry.passed).map((entry) => entry.id);

		expect(failed).toEqual(["liquidity", "freshness", "fee", "fill"]);
		expect(verdict.gates.filter((entry) => entry.blocker).map((entry) => entry.id)).toEqual([
			"liquidity",
		]);
	});

	it("explains the skip with the blocking check's reason", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, endsSoon);

		expect(verdict.detail).toContain("22m");
		expect(verdict.detail).toContain("1h");
	});

	it("leaves passing checks without a stated reason", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, textbook);

		expect(verdict.gates.every((entry) => entry.because === "")).toBe(true);
	});

	it("reports the trade size actually configured in the buy headline", () => {
		// $10 rather than $2.50: with the fee rail forcing entries at $0.60+, a
		// $2.50 ticket buys under the venue's 5-share minimum and the size check
		// blocks before a headline is ever produced.
		expect(evaluateSignal(withKnobs({ trade_size_usdc: 10 }), textbook).headline).toBe("BUY $10");
	});

	it("shows each check's live measurement against its rule", () => {
		expect(gate(LIVE_CONFIG, textbook, "crowd")?.actual).toBe("4 wallets");
		expect(gate(LIVE_CONFIG, textbook, "crowd")?.rule).toBe("≥ 3");
	});

	it("reports a sub-threshold crowd as no signal at all, never as a skip", () => {
		// The correction #63 asked for: below `cluster_threshold` the tracker emits
		// no alert, so the executor is never asked and no skip card is ever sent.
		// Calling it a SKIP would advertise a refusal the bot does not make.
		const lonely = { ...textbook, smartWallets: 1 };
		const verdict = evaluateSignal(LIVE_CONFIG, lonely);

		expect(verdict.action).toBe("no-signal");
		expect(verdict.headline).toBe("NO SIGNAL");
		expect(gate(LIVE_CONFIG, lonely, "crowd")?.actual).toBe("1 wallet");
	});

	it("explains a sub-threshold crowd as an alert never raised, not a rail refusing", () => {
		const lonely = { ...textbook, smartWallets: 1 };
		const verdict = evaluateSignal(LIVE_CONFIG, lonely);
		const crowd = gate(LIVE_CONFIG, lonely, "crowd");

		expect(crowd?.because).toContain("1 skilled wallet");
		expect(crowd?.because).toContain("no alert");
		expect(verdict.detail).toBe(crowd?.because);
		// The old copy said the bot "waits for 3", which describes something it saw
		// and declined. It saw nothing, and sent no skip card about it.
		expect(crowd?.because).not.toMatch(/skips?\b|waits for/i);
	});

	it("hands the same crowd to the executor once the threshold drops to one wallet", () => {
		const lonely = { ...textbook, smartWallets: 1 };
		expect(evaluateSignal(withKnobs({ cluster_threshold: 1 }), lonely).action).toBe("buy");
	});
});

describe("copying a selling crowd", () => {
	it("buys the opposite outcome at the complementary price", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, mirror);

		expect(verdict.action).toBe("buy");
		// They sold at $0.30, so our side is $0.70 and the limit is two 0.01 steps
		// above it — the percentage arm (1% of $0.70) is under one step.
		expect(verdict.detail).toContain("The crowd was selling");
		expect(verdict.detail).toContain("$0.70");
		expect(gate(LIVE_CONFIG, mirror, "fill")?.rule).toBe("≤ $0.72");
		expect(verdict.detail).toContain("buys back what they sold");
	});

	it("measures the drift on the side it would really trade", () => {
		// Their outcome drifted up (0.30 → 0.305), which makes ours cheaper.
		expect(gate(LIVE_CONFIG, mirror, "freshness")?.actual).toBe("moved in our favour");
	});

	it("judges the fee on our side too, which is what makes a dear mirror possible", () => {
		// The rail is not symmetric in `p <-> 1-p`: their 30¢ side would cost 3.5%
		// of the ticket to enter, ours costs 1.5%. Judging the crowd's side would
		// refuse the very mirrors that work.
		expect(gate(LIVE_CONFIG, mirror, "fee")?.actual).toBe("1.5%");
	});
});

describe("the staleness floor in grid steps", () => {
	it("counts a big percentage move as noise while it stays under the floor", () => {
		// 0.10 → 0.115 on a 0.01-step market: 15% adverse, but 1.5 steps, so the
		// conjunctive rail does not trip. This is the live behaviour, not a bug —
		// and it is why the panel prints the step count next to the percentage.
		const freshness = gate(LIVE_CONFIG, coarse, "freshness");

		expect(freshness?.passed).toBe(true);
		expect(freshness?.actual).toBe("15% (1.5 steps)");
		expect(freshness?.rule).toBe("≤ 3% or < 2 steps");
	});

	it("still refuses the cheap outcome the staleness floor let through", () => {
		// The lesson the fee rail added: passing the freshness check no longer
		// means the trade happens. A 10¢ outcome surrenders 4.5% of the ticket in
		// fees, and that is where the live book's real losses came from.
		const verdict = evaluateSignal(LIVE_CONFIG, coarse);

		expect(verdict.action).toBe("skip");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("fee");
		expect(gate(LIVE_CONFIG, coarse, "fee")?.actual).toBe("4.5%");
	});

	it("lets the percentage bind again once the floor is dialled down", () => {
		const verdict = evaluateSignal(withKnobs({ staleness_min_ticks: 1 }), coarse);

		expect(verdict.action).toBe("skip");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("freshness");
	});

	it("drops the step clause from the rule when the floor is switched off", () => {
		expect(gate(withKnobs({ staleness_min_ticks: 0 }), coarse, "freshness")?.rule).toBe("≤ 3%");
	});
});

describe("the venue's own two rules", () => {
	it("gives the limit at least the configured room in grid steps", () => {
		// 1% of $0.94 is under one cent, so on a whole-cent market the percentage
		// alone would round the limit back onto the reference — zero tolerance.
		expect(gate(LIVE_CONFIG, pricey, "fill")?.rule).toBe("≤ $0.96");
		expect(gate(withKnobs({ slippage_min_ticks: 0 }), pricey, "fill")?.rule).toBe("≤ $0.94");
	});

	it("refuses an order that buys fewer shares than the venue accepts", () => {
		expect(evaluateSignal(LIVE_CONFIG, pricey).action).toBe("buy");
		expect(gate(LIVE_CONFIG, pricey, "size")?.actual).toBe("5.2 shares");

		// The reason the live size is $5 and not $1: a dollar clears 5 shares only
		// on an outcome priced at or under $0.20.
		const verdict = evaluateSignal(withKnobs({ trade_size_usdc: 1 }), pricey);
		expect(verdict.action).toBe("skip");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("size");
		expect(verdict.detail).toContain("5 shares");
	});
});

describe("signalLine", () => {
	it("states what a buying crowd did, at the price they paid", () => {
		expect(signalLine(textbook)).toEqual({
			lead: "4 skilled wallets bought",
			market: textbook.market,
			trail: "at $0.64.",
		});
	});

	it("carries the translation for a selling crowd", () => {
		const line = signalLine(mirror);

		expect(line.lead).toBe("4 skilled wallets sold");
		expect(line.trail).toBe("at $0.30 — so the bot would buy the opposite outcome at $0.70.");
	});
});

describe("the rails added since the first live run", () => {
	it("refuses a crowd that was on the other side minutes ago", () => {
		const reversal = gate(LIVE_CONFIG, flipped, "reversal");

		expect(reversal?.passed).toBe(false);
		expect(reversal?.actual).toBe("2 of 4, 2m ago");
		expect(reversal?.rule).toBe("≤ 0 within 10m");
	});

	it("takes the same signal once the flip is older than the window", () => {
		const stale = { ...flipped, crowdFlip: { wallets: 2, secondsAgo: 1800 } };

		expect(evaluateSignal(LIVE_CONFIG, stale).action).toBe("buy");
	});

	it("stands the reversal rail down when the window is switched off", () => {
		const off = withKnobs({ reversal_lookback_s: 0 });

		expect(evaluateSignal(off, flipped).action).toBe("buy");
		expect(gate(off, flipped, "reversal")?.rule).toBe("off");
	});

	it("treats a tolerance of zero as the strictest setting, not as off", () => {
		// The trap the knob exists to make visible: `max_reversed_wallets: 0` reads
		// like a disabled rail and is the opposite. Raising it is what loosens.
		expect(LIVE_CONFIG.max_reversed_wallets).toBe(0);
		expect(evaluateSignal(LIVE_CONFIG, flipped).action).toBe("skip");

		const oneFlipper = { ...flipped, smartWallets: 5, crowdFlip: { wallets: 1, secondsAgo: 121 } };
		expect(evaluateSignal(LIVE_CONFIG, oneFlipper).action).toBe("skip");
		expect(evaluateSignal(withKnobs({ max_reversed_wallets: 1 }), oneFlipper).action).toBe("buy");
	});

	it("still refuses when dropping the flippers leaves too few to be a crowd", () => {
		// The second arm. Tolerating two flippers does not help when only two clean
		// wallets remain and it takes three to be a crowd — the flip was carrying
		// the signal, which is a different failure from "too many flipped".
		const carried = withKnobs({ max_reversed_wallets: 2 });
		const verdict = evaluateSignal(carried, flipped);

		expect(verdict.action).toBe("skip");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("reversal");
		expect(verdict.detail).toContain("2 skilled wallets");
		expect(verdict.detail).toContain("under the 3");
	});

	it("refuses a share too dear to be worth its own downside", () => {
		const price = gate(LIVE_CONFIG, tooDear, "price");

		expect(price?.passed).toBe(false);
		expect(price?.actual).toBe("$0.97");
		expect(price?.rule).toBe("≤ $0.95");
		// 97¢ to win 3¢ against a $5 downside — the asymmetry the rail exists for.
		expect(price?.because).toContain("$0.15");
	});

	it("turns the fee ceiling into the minimum price it really is", () => {
		// `rate * (1 - p) <= 2%` at a 5% venue rate is exactly `p >= $0.60`, which
		// is why the summary states a band rather than a ceiling.
		expect(summarySentence(LIVE_CONFIG)).toContain("between $0.60 and $0.95");
	});

	it("lets the cheap end back in when the fee ceiling is switched off", () => {
		const off = withKnobs({ max_entry_fee_pct: 0 });

		expect(evaluateSignal(off, coarse).action).toBe("buy");
		expect(gate(off, coarse, "fee")?.rule).toBe("off");
	});
});

describe("summarySentence", () => {
	it("states the live config in one sentence", () => {
		const sentence = summarySentence(LIVE_CONFIG);

		expect(sentence).toContain("3+ skilled wallets");
		expect(sentence).toContain("$1,000 of liquidity");
		expect(sentence).toContain("more than 1h left");
		expect(sentence).toContain("not moved more than 3%");
		expect(sentence).toContain("buys $5 ");
		expect(sentence).toContain("opposite outcome, if they were selling");
		expect(sentence).toContain("2 POL");
		expect(sentence).toContain("$5 spendable");
		expect(sentence).toContain("$20 in play");
	});

	it("rewrites itself from whatever the knobs currently say", () => {
		const sentence = summarySentence(withKnobs({ cluster_threshold: 7, exposure_cap_usdc: 50 }));

		expect(sentence).toContain("7+ skilled wallets");
		expect(sentence).toContain("$50 in play");
		expect(sentence).not.toContain("3+ skilled wallets");
	});
});
