import { findDataInconsistencies, findPublishedInconsistencies } from "./statement-sanity";

describe("findDataInconsistencies", () => {
	const clean = {
		type: "weekly",
		alert_count: 2453,
		hit_rate: 0.5194,
		hypothetical_pnl_usd: 3157.92,
		bankroll_usd: 10000,
		top_wallets: [],
	} satisfies import("./statement-sanity").StatementSanityInput;

	it("flags the PR #26 case: alerts with hit_rate 0 but positive PnL", () => {
		const prBad = {
			...clean,
			alert_count: 2067,
			hit_rate: 0,
			hypothetical_pnl_usd: 282.4999999999998,
		};
		expect(findDataInconsistencies(prBad)).not.toHaveLength(0);
	});

	it("passes a healthy weekly statement", () => {
		expect(findDataInconsistencies(clean)).toEqual([]);
	});

	it("does not flag hit_rate 0 when PnL is not positive (a genuine all-miss week)", () => {
		expect(findDataInconsistencies({ ...clean, hit_rate: 0, hypothetical_pnl_usd: -50 })).toEqual(
			[],
		);
		expect(findDataInconsistencies({ ...clean, hit_rate: 0, hypothetical_pnl_usd: 0 })).toEqual([]);
	});

	it("does not flag a genuinely low but non-zero hit_rate with positive PnL", () => {
		expect(findDataInconsistencies({ ...clean, hit_rate: 0.02, hypothetical_pnl_usd: 12 })).toEqual(
			[],
		);
	});

	it("flags a positive hit_rate reported with zero alerts", () => {
		expect(findDataInconsistencies({ ...clean, alert_count: 0, hit_rate: 0.5 })).not.toHaveLength(
			0,
		);
	});

	const monthly = {
		...clean,
		type: "monthly",
		pnl: { revenue_usd: 0, opex_usd: 0, net_usd: 0 },
	} satisfies import("./statement-sanity").StatementSanityInput;

	it("passes a consistent monthly P&L (net = revenue - opex)", () => {
		expect(findDataInconsistencies(monthly)).toEqual([]);
		expect(
			findDataInconsistencies({
				...monthly,
				pnl: { revenue_usd: 0, opex_usd: 480, net_usd: -480 },
			}),
		).toEqual([]);
	});

	it("flags a monthly P&L where net != revenue - opex", () => {
		expect(
			findDataInconsistencies({ ...monthly, pnl: { revenue_usd: 100, opex_usd: 30, net_usd: 0 } }),
		).not.toHaveLength(0);
	});

	it("passes top_wallets whose PnL stays within the bankroll", () => {
		expect(
			findDataInconsistencies({
				...clean,
				top_wallets: [{ hypothetical_pnl_usd: 174.95 }, { hypothetical_pnl_usd: -67.95 }, {}],
			}),
		).toEqual([]);
	});

	it("flags a top_wallet whose PnL magnitude exceeds the bankroll", () => {
		expect(
			findDataInconsistencies({
				...clean,
				bankroll_usd: 10000,
				top_wallets: [{ hypothetical_pnl_usd: 25000 }],
			}),
		).not.toHaveLength(0);
	});
});

describe("findPublishedInconsistencies", () => {
	const clean = {
		type: "weekly",
		alert_count: 2453,
		hit_rate: 0.5194,
		hypothetical_pnl_usd: 3157.92,
		bankroll_usd: 10000,
		top_wallets: [],
	} satisfies import("./statement-sanity").StatementSanityInput;
	const prBadData = { ...clean, hit_rate: 0, hypothetical_pnl_usd: 100 };

	it("exempts drafts: a draft carrying the PR #26 shape is not reported", () => {
		const entries = [
			{ file: "bad-draft.md", draft: true, data: prBadData },
			{ file: "good.md", draft: false, data: clean },
		];
		expect(findPublishedInconsistencies(entries)).toEqual([]);
	});

	it("reports a published entry with the PR #26 shape, keyed by file", () => {
		const res = findPublishedInconsistencies([{ file: "bad.md", draft: false, data: prBadData }]);
		expect(res).toHaveLength(1);
		expect(res[0]?.file).toBe("bad.md");
		expect(res[0]?.issues).not.toHaveLength(0);
	});
});
