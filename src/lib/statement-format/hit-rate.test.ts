import { describe, expect, it } from "vitest";
import { describeHitRate, formatHitRate } from "./hit-rate";

describe("formatHitRate", () => {
	it("reads as pending when nothing has resolved", () => {
		// `hit_rate: 0` over an empty denominator is vacuous, not a 0% success
		// rate. Rendering it as "0%" beside the stat's own "above 0.50 is signal"
		// caption is what put "263 calls, all wrong" on the live site
		// (auditmos/ogsfrompoly#236).
		expect(formatHitRate(0, 0)).toBe("pending");
	});

	it("still reads as a rate when outcomes genuinely all missed", () => {
		// 0 in favour out of 240 RESOLVED is a real 0%. Keying the wording off the
		// denominator rather than the rate is what keeps a genuinely bad week from
		// hiding behind "pending".
		expect(formatHitRate(0, 240)).toBe("0%");
	});

	it("renders a percent when outcomes resolved", () => {
		expect(formatHitRate(0.47, 240)).toBe("47%");
	});

	it("renders a percent when the denominator is unknown", () => {
		// Every statement published before `resolved_count` existed omits it.
		// Absent means unknown, never zero — those must keep rendering as before.
		expect(formatHitRate(0.51, undefined)).toBe("51%");
		expect(formatHitRate(0, undefined)).toBe("0%");
	});
});

describe("describeHitRate", () => {
	it("says nothing has settled, and gives the count, when the denominator is empty", () => {
		// The stat's standing caption ("0.50 ≈ a coin flip; above 0.50 is signal")
		// actively misreads an unresolved window. Replace it, don't append to it.
		const note = describeHitRate(263, 0);

		expect(note).toContain("0 of 263");
		expect(note).not.toContain("coin flip");
	});

	it("names the denominator when outcomes did resolve", () => {
		// Publishing a rate without its denominator is what let the 0.00 pass
		// unnoticed for a week, so the note carries it in both branches.
		const note = describeHitRate(263, 240);

		expect(note).toContain("240 of 263");
		expect(note).toContain("coin flip");
	});

	it("falls back to the standing note when the denominator is unknown", () => {
		// The back catalogue omits `resolved_count`; those pages must read exactly
		// as they did before, with no invented count.
		const note = describeHitRate(1034, undefined);

		expect(note).toContain("coin flip");
		expect(note).not.toContain("1034");
	});
});
