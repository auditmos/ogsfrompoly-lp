import { formatPercent } from "./percent";

describe("formatPercent", () => {
	it("renders a 0..1 value as an integer percent with a trailing %", () => {
		expect(formatPercent(0.6428)).toBe("64%");
		expect(formatPercent(0.5)).toBe("50%");
		expect(formatPercent(1)).toBe("100%");
		expect(formatPercent(0)).toBe("0%");
	});

	it("rounds half to nearest (banker's-rounding not required for one-decimal hit rates)", () => {
		expect(formatPercent(0.495)).toBe("50%");
		expect(formatPercent(0.494)).toBe("49%");
	});
});
