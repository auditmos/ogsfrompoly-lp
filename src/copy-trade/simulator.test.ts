import { isKnobKey, type KnobValues, LIVE_CONFIG, SCENARIOS, type Scenario } from "./config";
import { evaluateSignal, signalLine, summarySentence } from "./simulator";

// Destructuring the tuple keeps each fixture exactly typed — no array-access guard.
const [textbook, mirror, coarse, pricey, endsSoon, thin, chased, full, broke] = SCENARIOS;

function withKnobs(overrides: Partial<KnobValues>): KnobValues {
	return { ...LIVE_CONFIG, ...overrides };
}

/** The executor's own order of questions, ending with the two the venue asks. */
const GATE_ORDER = ["crowd", "room", "liquidity", "timing", "freshness", "floor", "fill", "size"];

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

	it("asks every question in executor order, whatever the outcome", () => {
		for (const scenario of SCENARIOS) {
			const verdict = evaluateSignal(LIVE_CONFIG, scenario);
			expect(verdict.gates.map((entry) => entry.id)).toEqual(GATE_ORDER);
		}
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
	])("skips $scenario.label on the check it was written to trip", ({ scenario, blocker }) => {
		const verdict = evaluateSignal(LIVE_CONFIG, scenario);

		expect(verdict.action).toBe("skip");
		expect(verdict.headline).toBe("SKIP");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe(blocker);
	});

	it("marks only the first failing check as the blocker", () => {
		// The thin market fails liquidity, freshness AND the limit; the real
		// executor never reaches the later ones, so only liquidity may be flagged.
		const verdict = evaluateSignal(LIVE_CONFIG, thin);
		const failed = verdict.gates.filter((entry) => !entry.passed).map((entry) => entry.id);

		expect(failed).toEqual(["liquidity", "freshness", "fill"]);
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
		expect(evaluateSignal(withKnobs({ trade_size_usdc: 2.5 }), textbook).headline).toBe(
			"BUY $2.50",
		);
	});

	it("shows each check's live measurement against its rule", () => {
		expect(gate(LIVE_CONFIG, textbook, "crowd")?.actual).toBe("4 wallets");
		expect(gate(LIVE_CONFIG, textbook, "crowd")?.rule).toBe("≥ 3");
	});

	it("turns a crowd skip into a buy when the threshold drops to one wallet", () => {
		const lonely = { ...textbook, smartWallets: 1 };
		expect(evaluateSignal(LIVE_CONFIG, lonely).action).toBe("skip");
		expect(gate(LIVE_CONFIG, lonely, "crowd")?.actual).toBe("1 wallet");
		expect(evaluateSignal(withKnobs({ cluster_threshold: 1 }), lonely).action).toBe("buy");
	});
});

describe("copying a selling crowd", () => {
	it("buys the opposite outcome at the complementary price", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, mirror);

		expect(verdict.action).toBe("buy");
		// They sold at $0.90, so our side is $0.10 and the limit is two 0.01 steps
		// above it — the percentage arm (1% of $0.10) is worth a tenth of a step.
		expect(verdict.detail).toContain("The crowd was selling");
		expect(verdict.detail).toContain("$0.10");
		expect(gate(LIVE_CONFIG, mirror, "fill")?.rule).toBe("≤ $0.12");
		expect(verdict.detail).toContain("buys back what they sold");
	});

	it("measures the drift on the side it would really trade", () => {
		// Their outcome drifted up (0.90 → 0.905), which makes ours cheaper.
		expect(gate(LIVE_CONFIG, mirror, "freshness")?.actual).toBe("moved in our favour");
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
		expect(evaluateSignal(LIVE_CONFIG, coarse).action).toBe("buy");
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
			trail: "at $0.36.",
		});
	});

	it("carries the translation for a selling crowd", () => {
		const line = signalLine(mirror);

		expect(line.lead).toBe("4 skilled wallets sold");
		expect(line.trail).toBe("at $0.90 — so the bot would buy the opposite outcome at $0.10.");
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
