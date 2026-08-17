import { complement, platformFeeUsdc, roundTo, snapDown, VENUE_FEE_RATE } from "./market-math";

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

describe("platformFeeUsdc", () => {
	it("charges per share, scaled by price × (1 − price)", () => {
		// 12.5 shares at $0.40: 0.05 × 0.4 × 0.6 = $0.012 a share.
		expect(platformFeeUsdc(12.5, 0.4)).toBeCloseTo(0.15, 10);
	});

	it("peaks at the middle of the range and decays toward both ends", () => {
		const middle = platformFeeUsdc(100, 0.5);
		expect(platformFeeUsdc(100, 0.1)).toBeLessThan(middle);
		expect(platformFeeUsdc(100, 0.9)).toBeLessThan(middle);
	});

	// The venue truncates the charge onto a 1e-5 grid, and does it from the
	// number's shortest decimal form — multiplying the double instead would knock
	// an exact grid point down a whole quantum (`0.1615 * 1e5` is 16149.999…).
	it("truncates the charge onto the venue's 1e-5 grid", () => {
		// 1 share at $0.50 → $0.0125, already a grid point.
		expect(platformFeeUsdc(1, 0.5)).toBe(0.0125);
		// 3.23 shares at $0.50 → 0.04037_5, truncated rather than rounded up.
		expect(platformFeeUsdc(3.23, 0.5)).toBe(0.04037);
		// 7 shares at $0.37 → 0.08158_5, likewise.
		expect(platformFeeUsdc(7, 0.37)).toBe(0.08158);
	});

	it("charges nothing outside the tradable price range", () => {
		expect(platformFeeUsdc(10, 0)).toBe(0);
		expect(platformFeeUsdc(10, 1)).toBe(0);
		expect(platformFeeUsdc(0, 0.5)).toBe(0);
	});

	it("publishes the venue rate the walkthroughs quote", () => {
		expect(VENUE_FEE_RATE).toBe(0.05);
	});
});
