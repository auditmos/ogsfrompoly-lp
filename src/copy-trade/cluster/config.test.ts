import {
	formatKnobValue,
	isKnobKey,
	KNOB_GROUP_ORDER,
	KNOBS,
	knobsInGroup,
	LIVE_CONFIG,
	SCENARIOS,
} from "./config";

describe("formatKnobValue", () => {
	it("renders each unit in the notation the panel shows", () => {
		expect(formatKnobValue("usdc", 1000)).toBe("$1,000");
		expect(formatKnobValue("pct", 1)).toBe("1%");
		expect(formatKnobValue("seconds", 3600)).toBe("1h");
		expect(formatKnobValue("pol", 2)).toBe("2 POL");
		expect(formatKnobValue("steps", 2)).toBe("2 steps");
		expect(formatKnobValue("count", 3)).toBe("3");
	});
});

describe("isKnobKey", () => {
	it("accepts every shipped knob key", () => {
		for (const knob of KNOBS) {
			expect(isKnobKey(knob.key)).toBe(true);
		}
	});

	it.each([
		undefined,
		"",
		"not_a_knob",
		"profit_destination",
	])("rejects %p read off the DOM", (value) => {
		expect(isKnobKey(value)).toBe(false);
	});
});

describe("knob definitions", () => {
	it("gives every knob a live default inside its own slider range", () => {
		for (const knob of KNOBS) {
			const live = LIVE_CONFIG[knob.key];
			expect(live).toBeGreaterThanOrEqual(knob.min);
			expect(live).toBeLessThanOrEqual(knob.max);
		}
	});

	it("places every knob in a group the panel renders", () => {
		const grouped = KNOB_GROUP_ORDER.flatMap((group) => knobsInGroup(group));
		expect(grouped).toHaveLength(KNOBS.length);
		expect(new Set(grouped.map((knob) => knob.key))).toEqual(
			new Set(KNOBS.map((knob) => knob.key)),
		);
	});

	it("locks the documented live config so a silent edit fails the build", () => {
		expect(LIVE_CONFIG).toEqual({
			cluster_threshold: 3,
			min_liquidity_usdc: 1000,
			min_seconds_to_resolution: 3600,
			staleness_pct: 3,
			staleness_min_ticks: 2,
			reversal_lookback_s: 600,
			max_reversed_wallets: 0,
			max_entry_fee_pct: 0.02,
			max_entry_price: 0.95,
			trade_size_usdc: 5,
			exposure_cap_usdc: 20,
			working_capital_floor_usdc: 5,
			gas_reserve_pol: 2,
			slippage_pct: 1,
			slippage_min_ticks: 2,
		});
	});
});

describe("example signals", () => {
	it("prices every outcome inside the venue's own bounds", () => {
		for (const scenario of SCENARIOS) {
			for (const price of [scenario.crowdPrice, scenario.currentPrice]) {
				expect(price).toBeGreaterThan(0);
				expect(price).toBeLessThan(1);
			}
		}
	});

	it("puts the crowd's own price on its market's quoting grid", () => {
		// The crowd's price came from a real order, and the exchange only accepts
		// order prices that sit exactly on the grid — an off-grid one here would
		// teach limit arithmetic that cannot happen. The *current* price is a live
		// quote and may sit between steps, which is the whole reason the staleness
		// rail carries a floor measured in steps.
		for (const scenario of SCENARIOS) {
			const steps = scenario.crowdPrice / scenario.tickSize;
			expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
		}
	});

	it("covers both a buying and a selling crowd", () => {
		const sides = new Set(SCENARIOS.map((scenario) => scenario.crowdSide));
		expect(sides).toEqual(new Set(["bought", "sold"]));
	});

	it("covers a crowd that had just been on the other side, and crowds that had not", () => {
		// `null` and a flip are different facts, not a missing value and a present
		// one: `null` is "we looked and nobody flipped", which the rail is entitled
		// to act on. Both shapes have to reach the simulator.
		const flips = SCENARIOS.map((scenario) => scenario.crowdFlip);

		expect(flips).toContain(null);
		expect(flips.some((flip) => flip !== null)).toBe(true);
	});

	it("never claims a flip by nobody, or a flip with no crowd behind it", () => {
		// The pair is one object precisely so these cannot drift apart.
		for (const scenario of SCENARIOS) {
			if (scenario.crowdFlip === null) continue;
			expect(scenario.crowdFlip.wallets).toBeGreaterThan(0);
			expect(scenario.crowdFlip.wallets).toBeLessThanOrEqual(scenario.smartWallets);
			expect(scenario.crowdFlip.secondsAgo).toBeGreaterThan(0);
		}
	});
});
