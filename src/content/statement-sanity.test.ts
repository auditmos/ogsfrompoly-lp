import {
	findDataInconsistencies,
	findPublishedInconsistencies,
	RECURRING_MONTHLY_OPEX_USD,
} from "./statement-sanity";

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

	// --- resolved_count: telling "0 of 0" apart from "0 of 240" ---------------
	//
	// Without a denominator the 0/0 collapse and a genuine all-miss week are the
	// same two numbers, so the guard above had to treat both as suspect. That made
	// a truthful statement for an unresolved window unpublishable — see
	// auditmos/ogsfrompoly#236, and ogsfrompoly-lp#30 before it.

	it("does not flag hit_rate 0 with positive PnL when resolved_count is explicitly 0", () => {
		// Macro markets resolve months out, so a 7-day window routinely resolves
		// nothing. hit_rate is then vacuous rather than a 0% success rate, and the
		// PnL is real: hypothetical PnL marks to price, not to resolution.
		expect(
			findDataInconsistencies({
				...clean,
				alert_count: 263,
				hit_rate: 0,
				hypothetical_pnl_usd: 199.11,
				resolved_count: 0,
			}),
		).toEqual([]);
	});

	it("still flags hit_rate 0 with positive PnL when outcomes DID resolve", () => {
		// The original 0/0 collapse must stay caught: 240 alerts resolved, not one
		// went in favour, yet PnL is positive. That is the upstream join bug.
		expect(
			findDataInconsistencies({
				...clean,
				alert_count: 263,
				hit_rate: 0,
				hypothetical_pnl_usd: 199.11,
				resolved_count: 240,
			}),
		).not.toHaveLength(0);
	});

	it("keeps flagging hit_rate 0 with positive PnL when resolved_count is absent", () => {
		// Every statement published before this field existed omits it. Absent must
		// stay suspect, or adding the field would silently retire the guard for the
		// whole back catalogue.
		expect(
			findDataInconsistencies({
				...clean,
				alert_count: 263,
				hit_rate: 0,
				hypothetical_pnl_usd: 199.11,
			}),
		).not.toHaveLength(0);
	});

	it("flags a non-zero hit_rate that claims zero resolved outcomes", () => {
		// A rate needs a denominator: 0 resolved cannot yield 0.47.
		expect(
			findDataInconsistencies({ ...clean, hit_rate: 0.47, resolved_count: 0 }),
		).not.toHaveLength(0);
	});

	it("flags resolved_count exceeding alert_count", () => {
		// More outcomes than alerts means the join fanned out.
		expect(
			findDataInconsistencies({ ...clean, alert_count: 263, resolved_count: 264 }),
		).not.toHaveLength(0);
	});

	it("passes a healthy statement carrying its denominator", () => {
		expect(findDataInconsistencies({ ...clean, alert_count: 2453, resolved_count: 1200 })).toEqual(
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

	// Recurring-opex floor — the standing polynode cost must be booked every month
	// from 2026-07 onward, so the P&L values are enforced, not remembered.
	const julyMonthly = {
		...monthly,
		period_start: "2026-07-01",
		pnl: { revenue_usd: 0, opex_usd: 50, net_usd: -50, runway_months: 12 },
	} satisfies import("./statement-sanity").StatementSanityInput;

	it("pins the recurring monthly opex floor at $50", () => {
		expect(RECURRING_MONTHLY_OPEX_USD).toBe(50);
	});

	it("passes a July+ monthly that books the recurring opex floor", () => {
		expect(findDataInconsistencies(julyMonthly)).toEqual([]);
	});

	it("flags a July+ monthly that drops below the recurring opex floor", () => {
		expect(
			findDataInconsistencies({
				...julyMonthly,
				pnl: { revenue_usd: 0, opex_usd: 0, net_usd: 0, runway_months: null },
			}),
		).not.toHaveLength(0);
	});

	it("exempts pre-July monthlies (May/June genuinely $0 opex) from the floor", () => {
		expect(
			findDataInconsistencies({
				...monthly,
				period_start: "2026-06-01",
				pnl: { revenue_usd: 0, opex_usd: 0, net_usd: 0, runway_months: null },
			}),
		).toEqual([]);
	});

	// Runway must agree with net: "covered" (null) only when net >= 0.
	it("flags 'covered' (null runway) when net is negative (a real burn)", () => {
		expect(
			findDataInconsistencies({
				...julyMonthly,
				pnl: { revenue_usd: 0, opex_usd: 50, net_usd: -50, runway_months: null },
			}),
		).not.toHaveLength(0);
	});

	it("flags a finite runway when net is non-negative (should be 'covered')", () => {
		expect(
			findDataInconsistencies({
				...julyMonthly,
				pnl: { revenue_usd: 200, opex_usd: 50, net_usd: 150, runway_months: 12 },
			}),
		).not.toHaveLength(0);
	});

	it("passes 'covered' (null runway) when revenue meets opex (net >= 0)", () => {
		expect(
			findDataInconsistencies({
				...julyMonthly,
				pnl: { revenue_usd: 50, opex_usd: 50, net_usd: 0, runway_months: null },
			}),
		).toEqual([]);
	});

	it("flags a non-positive finite runway", () => {
		expect(
			findDataInconsistencies({
				...julyMonthly,
				pnl: { revenue_usd: 0, opex_usd: 50, net_usd: -50, runway_months: 0 },
			}),
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
