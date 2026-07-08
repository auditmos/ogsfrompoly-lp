import { monthlyPnlRows } from "./monthly-pnl";

describe("monthlyPnlRows", () => {
	it("renders revenue/opex/net/runway for a standard loss month", () => {
		const rows = monthlyPnlRows({
			revenue_usd: 0,
			opex_usd: -4200,
			net_usd: -4200,
			runway_months: 11,
		});

		expect(rows).toEqual([
			{ label: "Revenue", value: "$0", tone: "default" },
			{ label: "Opex", value: "−$4,200", tone: "loss" },
			{ label: "Net", value: "−$4,200", tone: "loss" },
			{ label: "Runway", value: "11 mo.", tone: "default" },
		]);
	});

	it("renders a null runway as an explicit word, never the string 'null'", () => {
		const rows = monthlyPnlRows({
			revenue_usd: 5000,
			opex_usd: -4200,
			net_usd: 800,
			runway_months: null,
		});

		const runway = rows.find((r) => r.label === "Runway");
		expect(runway).toEqual({ label: "Runway", value: "covered", tone: "default" });
		expect(runway?.value).not.toBe("null");
	});

	it("states zero revenue explicitly for all-zero live data — no blank cells", () => {
		const rows = monthlyPnlRows({
			revenue_usd: 0,
			opex_usd: 0,
			net_usd: 0,
			runway_months: null,
		});

		expect(rows).toEqual([
			{ label: "Revenue", value: "$0", tone: "default" },
			{ label: "Opex", value: "$0", tone: "default" },
			{ label: "Net", value: "$0", tone: "default" },
			{ label: "Runway", value: "covered", tone: "default" },
		]);
		for (const row of rows) {
			expect(row.value.length).toBeGreaterThan(0);
		}
	});

	it("tones a profitable month with positive revenue and net as 'accent'", () => {
		const rows = monthlyPnlRows({
			revenue_usd: 9000,
			opex_usd: -4200,
			net_usd: 4800,
			runway_months: null,
		});

		expect(rows).toEqual([
			{ label: "Revenue", value: "+$9,000", tone: "accent" },
			{ label: "Opex", value: "−$4,200", tone: "loss" },
			{ label: "Net", value: "+$4,800", tone: "accent" },
			{ label: "Runway", value: "covered", tone: "default" },
		]);
	});
});
