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

	// A single wallet's contribution can exceed the headline PnL, because the
	// headline nets in hundreds of other (often negative) alerts. Display the
	// magnitude honestly rather than an alarming literal like "120%".
	// Real incident: 2026-05-31-weekly wallet_1f8a bucketed 175 vs headline 146.41.
	it('caps a wallet that exceeds the headline PnL at ">100%"', () => {
		expect(formatContributionPercent(175, 146.40999999999997)).toBe(">100%");
	});

	// A positive wallet against a negative headline yields a share past -100%.
	// Cap the magnitude symmetrically so no out-of-range literal ever renders.
	it('caps a share below -100% at "<-100%"', () => {
		expect(formatContributionPercent(175, -146.40999999999997)).toBe("<-100%");
	});

	// The cap is strict: an exact ±100% share (a wallet equal to the headline)
	// stays literal; only shares strictly beyond the boundary are collapsed.
	it.each<[number, number, string]>([
		[100, 100, "100%"], // exactly the headline → literal
		[-100, 100, "-100%"], // exactly the negative headline → literal
		[101, 100, ">100%"], // one point over → capped
		[-101, 100, "<-100%"], // one point under → capped
	])("keeps an exact bound literal but caps beyond it: wallet=%s total=%s to %s", (wallet, total, expected) => {
		expect(formatContributionPercent(wallet, total)).toBe(expected);
	});
});
