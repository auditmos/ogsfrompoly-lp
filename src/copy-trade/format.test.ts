import {
	formatDuration,
	formatFraction,
	formatPct,
	formatPrice,
	formatShares,
	formatSteps,
	formatUsd,
} from "./format";

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

describe("formatPrice", () => {
	it.each([
		// Outcome prices need three decimals: a 0.001-step market quotes them, and
		// `formatUsd` would round two different limits onto one string.
		[0.363, "$0.363"],
		[0.36, "$0.36"],
		[0.1, "$0.10"],
		[0.12, "$0.12"],
		[0.9, "$0.90"],
		// Float noise from `1 - 0.905` must not leak into the readout.
		[0.09499999999999997, "$0.095"],
	])("formats %p as %p", (input, expected) => {
		expect(formatPrice(input)).toBe(expected);
	});
});

describe("formatShares", () => {
	it.each([
		[5, "5 shares"],
		// Written as the division the panel actually performs: $5 at a $0.363 limit.
		[5 / 0.363, "13.8 shares"],
		[1 / 0.96, "1 share"],
	])("formats %p as %p", (input, expected) => {
		expect(formatShares(input)).toBe(expected);
	});
});

describe("formatSteps", () => {
	it.each([
		[0, "off"],
		[1, "1 step"],
		[2, "2 steps"],
		[1.5, "1.5 steps"],
	])("formats %p as %p", (input, expected) => {
		expect(formatSteps(input)).toBe(expected);
	});
});

describe("formatFraction", () => {
	it.each([
		// YAML carries these as fractions; readers get percentages.
		[0.02, "2%"],
		[0.5, "50%"],
		[0.005, "0.5%"],
		[0, "off"],
	])("formats %p as %p", (input, expected) => {
		expect(formatFraction(input)).toBe(expected);
	});
});
