import { formatUsdCompact } from "./usd-compact";

describe("formatUsdCompact", () => {
	it("renders values under $10,000 with explicit thousands separators", () => {
		expect(formatUsdCompact(2_143)).toBe("$2,143");
		expect(formatUsdCompact(487)).toBe("$487");
		expect(formatUsdCompact(0)).toBe("$0");
	});

	it("uses 'K' shorthand for round thousands at $10K and above", () => {
		expect(formatUsdCompact(50_000)).toBe("$50K");
		expect(formatUsdCompact(125_000)).toBe("$125K");
	});

	it("rounds to one decimal of K when the thousands value is not whole", () => {
		expect(formatUsdCompact(12_500)).toBe("$12.5K");
		expect(formatUsdCompact(12_499)).toBe("$12.5K");
	});

	it("uses 'M' shorthand for millions", () => {
		expect(formatUsdCompact(1_000_000)).toBe("$1M");
		expect(formatUsdCompact(2_300_000)).toBe("$2.3M");
	});
});
