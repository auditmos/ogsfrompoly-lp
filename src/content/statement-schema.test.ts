import { SCHEMA_VERSION, statementSchema } from "./statement-schema";

const validWeekly = {
	schema_version: 1,
	type: "weekly",
	title: "Week of May 19, 2026",
	summary: "Sign-randomization skill test on 142 alerts; aggregate hit rate 0.58.",
	period_start: "2026-05-19",
	period_end: "2026-05-25",
	bankroll_usd: 10_000,
	alert_count: 142,
	hit_rate: 0.58,
	hypothetical_pnl_usd: 412.5,
	categories: ["politics", "macro-finance"],
	top_wallets: [
		{ truncated_id: "wallet_a3f8", category: "politics" },
		{ truncated_id: "wallet_c12e", category: "macro-finance" },
	],
};

const validMonthly = {
	schema_version: 1,
	type: "monthly",
	title: "May 2026",
	summary: "Aggregate hit rate 0.55 across 612 alerts; project P&L attached.",
	period_start: "2026-05-01",
	period_end: "2026-05-31",
	bankroll_usd: 10_000,
	alert_count: 612,
	hit_rate: 0.55,
	hypothetical_pnl_usd: 1_240.75,
	categories: ["politics", "macro-finance", "crypto"],
	top_wallets: [{ truncated_id: "wallet_a3f8", category: "politics" }],
	pnl: {
		revenue_usd: 0,
		opex_usd: 480,
		net_usd: -480,
		runway_months: 18,
	},
};

describe("SCHEMA_VERSION", () => {
	it("is exported as a stable cross-repo contract marker", () => {
		expect(SCHEMA_VERSION).toBe(1);
	});

	it("matches the literal accepted by the schema (drift guard)", () => {
		const result = statementSchema.safeParse({ ...validWeekly, schema_version: SCHEMA_VERSION });
		expect(result.success).toBe(true);
	});

	it("rejects SCHEMA_VERSION + 1 (would be the next breaking version)", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			schema_version: SCHEMA_VERSION + 1,
		});
		expect(result.success).toBe(false);
	});
});

describe("statementSchema", () => {
	it("parses a minimal valid weekly statement", () => {
		const result = statementSchema.safeParse(validWeekly);
		expect(result.success).toBe(true);
	});

	it("parses a minimal valid monthly statement with pnl block", () => {
		const result = statementSchema.safeParse(validMonthly);
		expect(result.success).toBe(true);
	});

	it("rejects a weekly statement missing the period_end field and identifies it", () => {
		const { period_end: _, ...missingPeriodEnd } = validWeekly;
		const result = statementSchema.safeParse(missingPeriodEnd);
		expect(result.success).toBe(false);
		if (result.success) return;
		const offending = result.error.issues.find((i) => i.path.includes("period_end"));
		expect(offending).toBeDefined();
	});

	it.each([
		[-0.01, "below 0"],
		[1.01, "above 1"],
	])("rejects hit_rate %s (%s)", (badHitRate) => {
		const result = statementSchema.safeParse({ ...validWeekly, hit_rate: badHitRate });
		expect(result.success).toBe(false);
	});

	it.each([
		[-1, "negative"],
		[3.14, "non-integer"],
	])("rejects alert_count %s (%s)", (badCount) => {
		const result = statementSchema.safeParse({ ...validWeekly, alert_count: badCount });
		expect(result.success).toBe(false);
	});

	it("rejects a calendar-impossible date that passes the YYYY-MM-DD regex (2026-02-31)", () => {
		const result = statementSchema.safeParse({ ...validWeekly, period_start: "2026-02-31" });
		expect(result.success).toBe(false);
	});

	it.each([
		["2026-13-01", "month 13"],
		["2026-00-00", "month/day 00"],
		["2026-04-31", "April 31 (30-day month)"],
	])("rejects the calendar-impossible date %s (%s)", (badDate) => {
		const result = statementSchema.safeParse({ ...validWeekly, period_start: badDate });
		expect(result.success).toBe(false);
	});

	it("reports a clear message when a date is calendar-impossible", () => {
		const result = statementSchema.safeParse({ ...validWeekly, period_start: "2026-13-01" });
		expect(result.success).toBe(false);
		if (result.success) return;
		const offending = result.error.issues.find((i) => i.path.includes("period_start"));
		expect(offending?.message).toBe("not a real calendar date");
	});

	it.each([
		["2026-02-28", "Feb 28 in a common year"],
		["2024-02-29", "Feb 29 in a leap year"],
		["2026-12-31", "Dec 31 boundary"],
	])("accepts the real calendar date %s (%s)", (goodDate) => {
		const result = statementSchema.safeParse({
			...validWeekly,
			period_start: goodDate,
			period_end: goodDate,
		});
		expect(result.success).toBe(true);
	});

	it("rejects a statement where period_start is after period_end", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			period_start: "2026-05-25",
			period_end: "2026-05-19",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a statement with an unknown category", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			categories: ["politics", "sports"],
		});
		expect(result.success).toBe(false);
	});

	it.each([
		["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "full 0x address"],
		["0X742D35CC6634C0532925A3B844BC9E7595F0BEB0", "uppercase 0X address"],
	])("rejects a top_wallets entry whose truncated_id is %s (%s)", (badId) => {
		const result = statementSchema.safeParse({
			...validWeekly,
			top_wallets: [{ truncated_id: badId, category: "politics" }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a statement with duplicate categories", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			categories: ["politics", "politics"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a monthly statement without a pnl block", () => {
		const { pnl: _, ...missingPnl } = validMonthly;
		const result = statementSchema.safeParse(missingPnl);
		expect(result.success).toBe(false);
	});

	it.each<[unknown, string]>([
		[0, "below 1"],
		[2, "above 1 (would be the next breaking version)"],
		["1", "string instead of number"],
	])("rejects schema_version %s (%s)", (badVersion) => {
		const result = statementSchema.safeParse({ ...validWeekly, schema_version: badVersion });
		expect(result.success).toBe(false);
	});

	it("defaults the draft field to false when frontmatter omits it", () => {
		const result = statementSchema.safeParse(validWeekly);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.draft).toBe(false);
	});

	it("accepts an optional hypothetical_pnl_usd on a top_wallets entry (additive, no version bump)", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			top_wallets: [
				{ truncated_id: "wallet_a3f8", category: "politics", hypothetical_pnl_usd: 42.5 },
				{ truncated_id: "wallet_c12e", category: "macro-finance", hypothetical_pnl_usd: -17.25 },
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		const [firstWallet] = result.data.top_wallets;
		expect(firstWallet?.hypothetical_pnl_usd).toBe(42.5);
	});

	it("still parses top_wallets entries that omit the optional hypothetical_pnl_usd field", () => {
		const result = statementSchema.safeParse(validWeekly);
		expect(result.success).toBe(true);
		if (!result.success) return;
		const [firstWallet] = result.data.top_wallets;
		expect(firstWallet?.hypothetical_pnl_usd).toBeUndefined();
	});

	it("accepts an explicit draft: true marker (used by placeholder fixtures)", () => {
		const result = statementSchema.safeParse({ ...validWeekly, draft: true });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.draft).toBe(true);
	});

	it("accepts YAML-parsed Date instances for period bounds and normalises them to ISO date strings", () => {
		const result = statementSchema.safeParse({
			...validWeekly,
			period_start: new Date("2026-05-19T00:00:00Z"),
			period_end: new Date("2026-05-25T00:00:00Z"),
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.period_start).toBe("2026-05-19");
		expect(result.data.period_end).toBe("2026-05-25");
	});
});
