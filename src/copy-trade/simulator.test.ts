import { type KnobValues, LIVE_CONFIG, SCENARIOS } from "./config";
import { evaluateSignal, summarySentence } from "./simulator";

// Destructuring the tuple keeps each fixture exactly typed — no array-access guard.
const [textbook, endsSoon, thin, chased, lonely, full] = SCENARIOS;

function withKnobs(overrides: Partial<KnobValues>): KnobValues {
	return { ...LIVE_CONFIG, ...overrides };
}

const GATE_ORDER = ["crowd", "liquidity", "timing", "freshness", "room", "floor", "price"];

describe("evaluateSignal", () => {
	it("buys the textbook signal on the live config", () => {
		const verdict = evaluateSignal(LIVE_CONFIG, textbook);

		expect(verdict.action).toBe("buy");
		expect(verdict.headline).toBe("BUY $1");
		expect(verdict.gates.every((gate) => gate.passed)).toBe(true);
		expect(verdict.gates.some((gate) => gate.blocker)).toBe(false);
	});

	it("asks all seven questions in executor order, whatever the outcome", () => {
		for (const scenario of SCENARIOS) {
			const verdict = evaluateSignal(LIVE_CONFIG, scenario);
			expect(verdict.gates.map((gate) => gate.id)).toEqual(GATE_ORDER);
		}
	});

	it.each([
		{ scenario: endsSoon, blocker: "timing" },
		{ scenario: chased, blocker: "freshness" },
		{ scenario: lonely, blocker: "crowd" },
		{ scenario: full, blocker: "room" },
	])("skips $scenario.label on the check it was written to trip", ({ scenario, blocker }) => {
		const verdict = evaluateSignal(LIVE_CONFIG, scenario);

		expect(verdict.action).toBe("skip");
		expect(verdict.headline).toBe("SKIP");
		expect(verdict.gates.find((gate) => gate.blocker)?.id).toBe(blocker);
	});

	it("marks only the first failing check as the blocker", () => {
		// The thin market fails liquidity AND slippage; the real executor never
		// reaches the second one, so only liquidity may be flagged.
		const verdict = evaluateSignal(LIVE_CONFIG, thin);
		const failed = verdict.gates.filter((gate) => !gate.passed).map((gate) => gate.id);

		expect(failed).toEqual(["liquidity", "price"]);
		expect(verdict.gates.filter((gate) => gate.blocker).map((gate) => gate.id)).toEqual([
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

		expect(verdict.gates.every((gate) => gate.because === "")).toBe(true);
	});

	it("turns a lone-wallet skip into a buy when the crowd threshold drops to 1", () => {
		expect(evaluateSignal(LIVE_CONFIG, lonely).action).toBe("skip");
		expect(evaluateSignal(withKnobs({ cluster_threshold: 1 }), lonely).action).toBe("buy");
	});

	it("blocks on the working-capital floor once room is no longer the binding constraint", () => {
		const roomy = withKnobs({ exposure_cap_usdc: 10 });
		expect(evaluateSignal(roomy, full).action).toBe("buy");

		// full.balanceUsdc is $31, so a $1 ticket leaves $30 — under a $31 floor.
		const verdict = evaluateSignal({ ...roomy, working_capital_floor_usdc: 31 }, full);
		expect(verdict.action).toBe("skip");
		expect(verdict.gates.find((gate) => gate.blocker)?.id).toBe("floor");
	});

	it("reports the trade size actually configured in the buy headline", () => {
		expect(evaluateSignal(withKnobs({ trade_size_usdc: 2.5 }), textbook).headline).toBe(
			"BUY $2.50",
		);
	});

	it("shows each check's live measurement against its rule", () => {
		const crowd = evaluateSignal(LIVE_CONFIG, textbook).gates[0];

		expect(crowd?.actual).toBe("4 wallets");
		expect(crowd?.rule).toBe("≥ 3");
	});

	it("keeps wallet counts singular when only one wallet bought", () => {
		const crowd = evaluateSignal(LIVE_CONFIG, lonely).gates[0];

		expect(crowd?.actual).toBe("1 wallet");
	});
});

describe("summarySentence", () => {
	it("states the live config in one sentence", () => {
		const sentence = summarySentence(LIVE_CONFIG);

		expect(sentence).toContain("3+ skilled wallets");
		expect(sentence).toContain("$1,000 of liquidity");
		expect(sentence).toContain("more than 1h left");
		expect(sentence).toContain("not moved more than 3%");
		expect(sentence).toContain("buys $1 ");
		expect(sentence).toContain("2 POL");
		expect(sentence).toContain("$20 on the floor");
		expect(sentence).toContain("$5 in play");
	});

	it("rewrites itself from whatever the knobs currently say", () => {
		const sentence = summarySentence(withKnobs({ cluster_threshold: 7, exposure_cap_usdc: 50 }));

		expect(sentence).toContain("7+ skilled wallets");
		expect(sentence).toContain("$50 in play");
		expect(sentence).not.toContain("3+ skilled wallets");
	});
});
