import { formatPeriodLabel } from "./period";

describe("formatPeriodLabel", () => {
	it("renders a weekly period as 'Mon DD – Mon DD, YYYY' when the week spans two months", () => {
		expect(formatPeriodLabel("2026-05-25", "2026-05-31", "weekly")).toBe("May 25 – May 31, 2026");
		expect(formatPeriodLabel("2026-05-25", "2026-06-01", "weekly")).toBe("May 25 – Jun 1, 2026");
	});

	it("renders a monthly period as 'Month YYYY' regardless of exact period_end day", () => {
		expect(formatPeriodLabel("2026-05-01", "2026-05-31", "monthly")).toBe("May 2026");
		expect(formatPeriodLabel("2026-12-01", "2026-12-31", "monthly")).toBe("December 2026");
	});

	it("renders a weekly period across a year boundary with the trailing year", () => {
		expect(formatPeriodLabel("2026-12-28", "2027-01-03", "weekly")).toBe(
			"Dec 28, 2026 – Jan 3, 2027",
		);
	});
});
