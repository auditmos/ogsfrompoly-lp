import { formatSignedUsd } from "./signed-usd";

describe("formatSignedUsd", () => {
	it("prefixes positive values with '+$' and thousands-separates the amount", () => {
		expect(formatSignedUsd(2_143)).toBe("+$2,143");
		expect(formatSignedUsd(12_500)).toBe("+$12,500");
	});

	it("prefixes negative values with the U+2212 minus sign, not ASCII '-'", () => {
		expect(formatSignedUsd(-487)).toBe("−$487");
		expect(formatSignedUsd(-12_500)).toBe("−$12,500");
	});

	it("renders zero as '$0' without a sign", () => {
		expect(formatSignedUsd(0)).toBe("$0");
	});

	it("rounds to whole dollars (PnL precision in headlines)", () => {
		expect(formatSignedUsd(2_143.62)).toBe("+$2,144");
		expect(formatSignedUsd(-487.4)).toBe("−$487");
	});
});
