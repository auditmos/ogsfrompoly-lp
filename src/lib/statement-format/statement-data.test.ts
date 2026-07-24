import { statementSchema } from "@/content/statement-schema";
import { asStatementData, type Statement } from "./statement-data";

const validWeekly = {
	schema_version: 1,
	type: "weekly",
	title: "Week of 2026-05-25",
	summary: "ogsfrompoly weekly statement — 1034 alerts, hit rate 0.51.",
	period_start: "2026-05-25",
	period_end: "2026-05-31",
	bankroll_usd: 10000,
	alert_count: 1034,
	hit_rate: 0.51,
	hypothetical_pnl_usd: 146.41,
	categories: ["politics", "crypto"],
	top_wallets: [{ truncated_id: "wallet_a3f", category: "politics", hypothetical_pnl_usd: 100 }],
};

const validMonthly = {
	schema_version: 1,
	type: "monthly",
	title: "May 2026",
	summary: "ogsfrompoly monthly statement — 1128 alerts, hit rate 0.71.",
	period_start: "2026-05-01",
	period_end: "2026-05-31",
	bankroll_usd: 10000,
	alert_count: 1128,
	hit_rate: 0.7,
	hypothetical_pnl_usd: 462.28,
	categories: ["politics"],
	top_wallets: [],
	pnl: { revenue_usd: 100, opex_usd: 50, net_usd: 50, runway_months: null },
};

describe("asStatementData", () => {
	it("accepts a valid weekly statement, returning exactly the schema's parse result", () => {
		expect(asStatementData(validWeekly)).toEqual(statementSchema.parse(validWeekly));
	});

	it("accepts a valid monthly statement and preserves its pnl block", () => {
		const parsed = asStatementData(validMonthly);
		expect(parsed?.type).toBe("monthly");
		// discriminated-union narrowing exposes pnl only on the monthly variant
		if (parsed?.type === "monthly") {
			expect(parsed.pnl).toEqual({
				revenue_usd: 100,
				opex_usd: 50,
				net_usd: 50,
				runway_months: null,
			});
		}
	});

	it("returns null for non-object input", () => {
		expect(asStatementData(null)).toBeNull();
		expect(asStatementData("not a statement")).toBeNull();
		expect(asStatementData(42)).toBeNull();
	});

	it("returns null when a required field is missing or malformed", () => {
		const { hit_rate: _omit, ...missingHitRate } = validWeekly;
		expect(asStatementData(missingHitRate)).toBeNull();
		expect(asStatementData({ ...validWeekly, type: "quarterly" })).toBeNull();
		expect(asStatementData({ ...validMonthly, pnl: undefined })).toBeNull();
	});

	// Drift is impossible by construction: the guard IS the schema. This asserts
	// asStatementData accepts EXACTLY what statementSchema accepts, so a schema
	// change can never leave the guard behind (silently blanking the metrics).
	it("accepts exactly the set of inputs the schema accepts", () => {
		const candidates: unknown[] = [
			validWeekly,
			validMonthly,
			null,
			"string",
			{ ...validWeekly, hit_rate: 2 }, // out of [0,1] range
			{ ...validWeekly, categories: [] }, // violates .min(1)
			{ ...validMonthly, pnl: { revenue_usd: 1 } }, // incomplete pnl
			{ ...validWeekly, period_start: "2026-06-01", period_end: "2026-05-31" }, // start > end
		];
		for (const candidate of candidates) {
			const accepted = asStatementData(candidate) !== null;
			const schemaOk = statementSchema.safeParse(candidate).success;
			expect(accepted).toBe(schemaOk);
		}
	});

	it("shares one type with the schema (compile-time proof)", () => {
		// If Statement were not z.infer<typeof statementSchema>, this fails to compile.
		const fromSchema: Statement = statementSchema.parse(validWeekly);
		expect(fromSchema.title).toBe(validWeekly.title);
	});
});
