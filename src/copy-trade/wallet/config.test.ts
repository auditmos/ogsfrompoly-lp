import {
	formatRatio,
	formatWalletKnobValue,
	isWalletKnobKey,
	leaderKnobKey,
	WALLET_ENTRY_GROUP_ORDER,
	WALLET_KNOBS,
	WALLET_LIVE_CONFIG,
	WALLET_SCENARIOS,
	walletKnobsInGroup,
} from "./config";

describe("formatRatio", () => {
	it.each([
		[0.5, "0.50"],
		[0.78, "0.78"],
		[0, "0.00"],
		// At 1 every ratio passes, so the rail is off — not "everything refused".
		[1, "off"],
	])("formats %p as %p", (input, expected) => {
		expect(formatRatio(input)).toBe(expected);
	});
});

describe("formatWalletKnobValue", () => {
	it("renders each unit in the notation the panel shows", () => {
		expect(formatWalletKnobValue("usdc", 500)).toBe("$500");
		expect(formatWalletKnobValue("pct", 1)).toBe("1%");
		expect(formatWalletKnobValue("fraction", 0.5)).toBe("50%");
		expect(formatWalletKnobValue("price", 0.95)).toBe("$0.95");
		expect(formatWalletKnobValue("seconds", 3600)).toBe("1h");
		expect(formatWalletKnobValue("steps", 2)).toBe("2 steps");
		expect(formatWalletKnobValue("count", 2)).toBe("2");
		expect(formatWalletKnobValue("ratio", 0.5)).toBe("0.50");
	});
});

describe("leaderKnobKey", () => {
	it("maps each leader onto its own conviction bar", () => {
		expect(leaderKnobKey("leader-a")).toBe("leader_a_min_notional_usdc");
		expect(leaderKnobKey("leader-b")).toBe("leader_b_min_notional_usdc");
	});
});

describe("isWalletKnobKey", () => {
	it("accepts every shipped knob key", () => {
		for (const knob of WALLET_KNOBS) {
			expect(isWalletKnobKey(knob.key)).toBe(true);
		}
	});

	it.each([
		undefined,
		"",
		"not_a_knob",
		"profit_destination",
		"cluster_threshold",
	])("rejects %p read off the DOM", (value) => {
		expect(isWalletKnobKey(value)).toBe(false);
	});
});

describe("knob definitions", () => {
	it("gives every knob a live default inside its own slider range", () => {
		for (const knob of WALLET_KNOBS) {
			const live = WALLET_LIVE_CONFIG[knob.key];
			expect(live).toBeGreaterThanOrEqual(knob.min);
			expect(live).toBeLessThanOrEqual(knob.max);
		}
	});

	it("places every knob in a group a panel renders", () => {
		// The entry panel renders four groups; the exit widget renders the fifth.
		const grouped = [...WALLET_ENTRY_GROUP_ORDER, "exit" as const].flatMap((group) =>
			walletKnobsInGroup(group),
		);
		expect(grouped).toHaveLength(WALLET_KNOBS.length);
		expect(new Set(grouped.map((knob) => knob.key))).toEqual(
			new Set(WALLET_KNOBS.map((knob) => knob.key)),
		);
	});

	it("locks the documented live config so a silent edit fails the build", () => {
		expect(WALLET_LIVE_CONFIG).toEqual({
			leader_a_min_notional_usdc: 500,
			leader_b_min_notional_usdc: 100,
			max_open_copies_per_leader: 2,
			max_wallet_two_sided_ratio: 0.5,
			min_liquidity_usdc: 1000,
			min_seconds_to_resolution: 3600,
			staleness_pct: 3,
			staleness_min_ticks: 2,
			max_entry_price: 0.95,
			trade_size_usdc: 5,
			exposure_cap_usdc: 20,
			working_capital_floor_usdc: 5,
			slippage_pct: 1,
			slippage_min_ticks: 2,
			trim_close_fraction: 0.5,
		});
	});

	it("names where each knob lives in the YAML, nesting the per-leader bars", () => {
		for (const knob of WALLET_KNOBS) {
			if (knob.key === "leader_a_min_notional_usdc" || knob.key === "leader_b_min_notional_usdc") {
				expect(knob.yamlKey).toContain("min_leader_notional_usdc");
				expect(knob.yamlKey).toContain("leaders[");
			} else {
				expect(knob.yamlKey).toBe(knob.key);
			}
		}
	});
});

describe("example signals", () => {
	it("prices every outcome inside the venue's own bounds", () => {
		for (const scenario of WALLET_SCENARIOS) {
			for (const price of [scenario.entryPrice, scenario.bestAsk, scenario.currentPrice]) {
				expect(price).toBeGreaterThan(0);
				expect(price).toBeLessThan(1);
			}
		}
	});

	it("puts the leader's effective price on its market's quoting grid", () => {
		// The leader's price came from real fills (complement-flipped when they
		// sold), and both live grids quote in exact steps — an off-grid price here
		// would teach limit arithmetic that cannot happen.
		for (const scenario of WALLET_SCENARIOS) {
			const steps = scenario.entryPrice / scenario.tickSize;
			expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
		}
	});

	it("covers both leaders, and a position built by selling", () => {
		const leaders = new Set(WALLET_SCENARIOS.map((scenario) => scenario.leader));
		expect(leaders).toEqual(new Set(["leader-a", "leader-b"]));
		expect(WALLET_SCENARIOS.some((scenario) => scenario.viaSale)).toBe(true);
	});

	it("covers a measured flow ratio and an empty window", () => {
		// `null` and a ratio are different facts: `null` is "the 48 hours held
		// nothing to weigh", which stands the rail down. Both shapes must reach
		// the simulator.
		const ratios = WALLET_SCENARIOS.map((scenario) => scenario.flowRatio);
		expect(ratios).toContain(null);
		expect(ratios.some((ratio) => ratio !== null)).toBe(true);
	});

	it("gives every signal a unique id for the panel's button state", () => {
		expect(new Set(WALLET_SCENARIOS.map((s) => s.id)).size).toBe(WALLET_SCENARIOS.length);
	});

	it("never invents a market with a wallet in its name", () => {
		for (const scenario of WALLET_SCENARIOS) {
			expect(scenario.market).not.toMatch(/0x[0-9a-f]{4,}/i);
			expect(scenario.market).not.toMatch(/wallet_/);
		}
	});
});
