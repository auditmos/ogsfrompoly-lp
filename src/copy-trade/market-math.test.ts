import { complement, roundTo, snapDown } from "./market-math";

describe("roundTo", () => {
	it.each([
		[0.09499999999999997, 4, 0.095],
		[Math.PI, 2, 3.14],
		[27.400000000000002, 2, 27.4],
	])("rounds %p to %p decimals as %p", (value, decimals, expected) => {
		expect(roundTo(value, decimals)).toBe(expected);
	});
});

describe("complement", () => {
	it.each([
		// `1 - 0.905` is `0.09499…` in floats; the readout must see `0.095`.
		[0.905, 0.095],
		[0.3, 0.7],
		[0.64, 0.36],
	])("prices the other outcome of %p at %p", (price, expected) => {
		expect(complement(price)).toBe(expected);
	});
});

describe("snapDown", () => {
	it("rounds a limit down onto the market's grid, never up", () => {
		expect(snapDown(0.6464, 0.001)).toBe(0.646);
		expect(snapDown(0.6464, 0.01)).toBe(0.64);
	});

	it("keeps the snapped limit inside the venue's own price bounds", () => {
		expect(snapDown(0.0004, 0.001)).toBe(0.001);
		expect(snapDown(1.2, 0.01)).toBe(0.99);
	});

	it("passes the price through untouched when the grid is off", () => {
		expect(snapDown(0.6464, 0)).toBe(0.6464);
	});
});
