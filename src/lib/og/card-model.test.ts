import type { Statement } from "@/lib/statement-format/statement-data";
import { BRAND_CARD_MODEL, buildStatementCardModel } from "./card-model";

const weekly: Statement = {
	schema_version: 1,
	type: "weekly",
	title: "Skilled wallets held the line",
	summary: "A weekly statement.",
	period_start: "2026-05-25",
	period_end: "2026-05-31",
	bankroll_usd: 10_000,
	alert_count: 12,
	hit_rate: 0.6428,
	hypothetical_pnl_usd: 1240,
	categories: ["politics", "macro-finance"],
	top_wallets: [
		{ truncated_id: "wallet_a3f…", category: "politics", hypothetical_pnl_usd: 800 },
		{ truncated_id: "wallet_9zz…", category: "crypto", hypothetical_pnl_usd: -120 },
	],
	draft: false,
};

const monthly: Statement = {
	schema_version: 1,
	type: "monthly",
	title: "May in the red",
	summary: "A monthly statement.",
	period_start: "2026-05-01",
	period_end: "2026-05-31",
	bankroll_usd: 10_000,
	alert_count: 41,
	hit_rate: 0.52,
	hypothetical_pnl_usd: -560,
	categories: ["crypto"],
	top_wallets: [{ truncated_id: "wallet_deadbeef…", category: "crypto" }],
	draft: false,
	pnl: { revenue_usd: 500, opex_usd: 900, net_usd: -400, runway_months: 6 },
};

describe("buildStatementCardModel", () => {
	it("uses the statement title and an uppercased type · period eyebrow for a weekly card", () => {
		const model = buildStatementCardModel(weekly);

		expect(model.variant).toBe("statement");
		expect(model.title).toBe("Skilled wallets held the line");
		expect(model.eyebrow).toBe("WEEKLY · May 25 – May 31, 2026");
	});

	it("labels a monthly card with the month-and-year period", () => {
		const model = buildStatementCardModel(monthly);

		expect(model.eyebrow).toBe("MONTHLY · May 2026");
	});

	it("surfaces hit rate, hypothetical PnL and alert count as aggregate stats", () => {
		const model = buildStatementCardModel(weekly);

		expect(model.stats).toEqual([
			{ label: "Hit rate", value: "64%", tone: "default" },
			{ label: "Hypo. PnL", value: "+$1,240", tone: "accent" },
			{ label: "Alerts", value: "12", tone: "default" },
		]);
	});

	it("tones the PnL stat as a loss when the hypothetical PnL is negative", () => {
		const model = buildStatementCardModel(monthly);
		const pnl = model.stats.find((s) => s.label === "Hypo. PnL");

		expect(pnl).toEqual({ label: "Hypo. PnL", value: "−$560", tone: "loss" });
	});

	it("never leaks per-wallet data onto the card (disclosure policy)", () => {
		const serialized = JSON.stringify(buildStatementCardModel(weekly));

		expect(serialized).not.toContain("wallet_a3f");
		expect(serialized).not.toContain("wallet_9zz");
		expect(serialized).not.toContain("top_wallets");
	});
});

describe("BRAND_CARD_MODEL", () => {
	it("is the brand variant carrying the locked hero claim and the site name", () => {
		expect(BRAND_CARD_MODEL.variant).toBe("brand");
		expect(BRAND_CARD_MODEL.title).toBe("ogsfrompoly");
		expect(BRAND_CARD_MODEL.tagline).toContain("skilled on Polymarket");
		expect(BRAND_CARD_MODEL.stats).toEqual([]);
	});
});
