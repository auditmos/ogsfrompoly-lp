import { formatContributionPercent } from "./contribution-percent";

describe("formatContributionPercent", () => {
	it.each<[number, number, string]>([
		[50, 200, "25%"],
		[100, 200, "50%"],
		[200, 200, "100%"],
		[33, 100, "33%"],
		[-25, 100, "-25%"],
		[25, -100, "-25%"],
		[1.5, 10, "15%"],
	])("formats wallet=%s of total=%s as %s", (wallet, total, expected) => {
		expect(formatContributionPercent(wallet, total)).toBe(expected);
	});

	it("returns null when total is zero (cannot compute share)", () => {
		expect(formatContributionPercent(50, 0)).toBeNull();
	});
});
