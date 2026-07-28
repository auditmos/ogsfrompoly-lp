import {
	formatDuration,
	formatKnobValue,
	formatPct,
	formatUsd,
	formatWalletCount,
	isKnobKey,
	KNOB_GROUP_ORDER,
	KNOBS,
	knobsInGroup,
	LIVE_CONFIG,
} from "./config";

describe("formatUsd", () => {
	it.each([
		[0, "$0"],
		[1, "$1"],
		[0.5, "$0.50"],
		[26, "$26"],
		[28.4, "$28.40"],
		[1000, "$1,000"],
		[4200, "$4,200"],
		[12400, "$12,400"],
		[-1.5, "-$1.50"],
		// Float noise from `balance - trade_size` must not leak into the readout.
		[27.400000000000002, "$27.40"],
	])("formats %p as %p", (input, expected) => {
		expect(formatUsd(input)).toBe(expected);
	});
});

describe("formatPct", () => {
	it.each([
		[3, "3%"],
		[1.1, "1.1%"],
		[0.5, "0.5%"],
		[5.8, "5.8%"],
	])("formats %p as %p", (input, expected) => {
		expect(formatPct(input)).toBe(expected);
	});
});

describe("formatDuration", () => {
	it.each([
		[0, "off"],
		[900, "15m"],
		[1320, "22m"],
		[3600, "1h"],
		[5400, "1.5h"],
		[21600, "6h"],
		[86400, "1d"],
		[259200, "3d"],
	])("formats %p seconds as %p", (input, expected) => {
		expect(formatDuration(input)).toBe(expected);
	});
});

describe("formatKnobValue", () => {
	it("renders each unit in the notation the panel shows", () => {
		expect(formatKnobValue("usdc", 1000)).toBe("$1,000");
		expect(formatKnobValue("pct", 1)).toBe("1%");
		expect(formatKnobValue("seconds", 3600)).toBe("1h");
		expect(formatKnobValue("pol", 2)).toBe("2 POL");
		expect(formatKnobValue("count", 3)).toBe("3");
	});
});

describe("formatWalletCount", () => {
	it.each([
		[1, "1 skilled wallet"],
		[3, "3 skilled wallets"],
		[0, "0 skilled wallets"],
	])("describes %p wallets as %p", (input, expected) => {
		expect(formatWalletCount(input)).toBe(expected);
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
			trade_size_usdc: 1,
			exposure_cap_usdc: 5,
			working_capital_floor_usdc: 20,
			gas_reserve_pol: 2,
			slippage_pct: 1,
		});
	});
});
