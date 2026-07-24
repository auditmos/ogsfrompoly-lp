/**
 * Consumer-side cross-field sanity checks for statement frontmatter.
 *
 * These are deliberately kept OUT of the Zod schema (`statement-schema.ts`):
 * the schema is the stable cross-repo contract, and narrowing it would force a
 * `SCHEMA_VERSION` bump coordinated with upstream poly-track. A consumer-side
 * lint instead fails CI at flip-time (see `docs/statement-schema.md`) without
 * touching the contract. Mirrors `body-disclosure.ts`: a pure function returning
 * a list of human-readable problems (empty = clean), tested at its boundary.
 *
 * Motivating incident: ogsfrompoly-lp#30 — statements shipped `hit_rate: 0.0`
 * with `alert_count > 0` and positive PnL, the signature of an upstream
 * resolution join that produced 0 resolved alerts and collapsed `0/0` to `0`.
 */

/**
 * The known recurring monthly operating cost — the ogsfrompoly polynode, $50/mo,
 * booked cash-basis — that every monthly statement from {@link OPEX_FLOOR_FROM}
 * onward must account for. A monthly P&L reporting less than this has dropped a
 * standing cost: the tell of a hand-edit, or a generator that forgot the ledger.
 * This is what makes the recurring values "calculated every month" enforceable
 * rather than a note someone has to remember. See the `copytrading-pnl-economics`
 * operator note and `docs/statement-schema.md`.
 */
export const RECURRING_MONTHLY_OPEX_USD = 50;

/**
 * Inclusive ISO date from which the recurring-opex floor applies. The polynode
 * went live 2026-07-24 and its first charge is booked to July, so July 2026 is
 * the first month expected to carry it. May/June 2026 (genuinely $0 opex) are
 * exempt by predating this.
 */
const OPEX_FLOOR_FROM = "2026-07-01";

/** The frontmatter fields the cross-field checks read. */
export interface StatementSanityInput {
	type?: string;
	period_start?: string;
	alert_count: number;
	hit_rate: number;
	hypothetical_pnl_usd: number;
	bankroll_usd: number;
	top_wallets?: ReadonlyArray<{ hypothetical_pnl_usd?: number }>;
	pnl?: { revenue_usd: number; opex_usd: number; net_usd: number; runway_months?: number | null };
}

/**
 * Return every cross-field inconsistency in a statement's frontmatter.
 * Empty array = internally consistent.
 */
export function findDataInconsistencies(data: StatementSanityInput): string[] {
	const issues: string[] = [];

	// A 0 hit rate over resolved alerts cannot coexist with positive PnL under the
	// mirror-every-alert model — the tell of a `0/0 → 0` resolution collapse.
	if (data.alert_count > 0 && data.hit_rate === 0 && data.hypothetical_pnl_usd > 0) {
		issues.push(
			`alert_count=${data.alert_count} with hit_rate=0 but hypothetical_pnl_usd=${data.hypothetical_pnl_usd} > 0 (0 resolved alerts collapsing 0/0 → 0?)`,
		);
	}

	// A non-zero hit rate is undefined without alerts to have hit.
	if (data.hit_rate > 0 && data.alert_count === 0) {
		issues.push(`hit_rate=${data.hit_rate} with alert_count=0 (a rate over no alerts)`);
	}

	// Monthly P&L cross-field checks (balance, recurring-opex floor, runway).
	if (data.pnl) {
		issues.push(...findPnlInconsistencies(data.pnl, data.type, data.period_start));
	}

	// A single wallet's hypothetical PnL is sized against the same bankroll; it
	// cannot exceed the whole bankroll. Orders-of-magnitude overshoot signals a
	// stake/normalization bug upstream.
	for (const wallet of data.top_wallets ?? []) {
		if (
			wallet.hypothetical_pnl_usd !== undefined &&
			Math.abs(wallet.hypothetical_pnl_usd) > data.bankroll_usd
		) {
			issues.push(
				`top_wallets entry hypothetical_pnl_usd=${wallet.hypothetical_pnl_usd} exceeds bankroll_usd=${data.bankroll_usd}`,
			);
		}
	}

	return issues;
}

type PnlInput = NonNullable<StatementSanityInput["pnl"]>;

/** Cross-field checks for the monthly `pnl` block. Empty array = consistent. */
function findPnlInconsistencies(
	pnl: PnlInput,
	type: string | undefined,
	periodStart: string | undefined,
): string[] {
	const issues: string[] = [];
	const { revenue_usd, opex_usd, net_usd, runway_months } = pnl;

	// Must balance: net = revenue - opex (opex is a positive magnitude, per
	// docs/statement-schema.md). Tolerate float noise.
	if (Math.abs(net_usd - (revenue_usd - opex_usd)) > 1e-6) {
		issues.push(
			`pnl.net_usd=${net_usd} != revenue_usd - opex_usd (${revenue_usd} - ${opex_usd} = ${revenue_usd - opex_usd})`,
		);
	}

	// Recurring-opex floor: every monthly statement from the polynode's first
	// billed month onward must book at least the standing $50/mo. Below the floor,
	// a known standing cost was dropped — this is the gate that keeps the recurring
	// values in the calculation every month, not by memory.
	const belowFloor =
		type === "monthly" &&
		periodStart !== undefined &&
		periodStart >= OPEX_FLOOR_FROM &&
		opex_usd < RECURRING_MONTHLY_OPEX_USD;
	if (belowFloor) {
		issues.push(
			`monthly opex_usd=${opex_usd} is below the recurring floor ${RECURRING_MONTHLY_OPEX_USD} (dropped the standing polynode cost?)`,
		);
	}

	// Runway must agree with net. "covered" (null) means revenue meets opex, so it
	// is only valid when net >= 0; a net burn (net < 0) requires a finite, positive
	// months-of-runway figure against the opex reserve. A missing field (undefined)
	// is left to the Zod schema, which requires it on every monthly.
	if (runway_months === null && net_usd < 0) {
		issues.push(
			`runway is "covered" (null) but net_usd=${net_usd} < 0 (a net burn needs a finite runway)`,
		);
	} else if (typeof runway_months === "number") {
		if (net_usd >= 0) {
			issues.push(
				`runway_months=${runway_months} is finite but net_usd=${net_usd} >= 0 (should be "covered"/null)`,
			);
		}
		if (runway_months <= 0) {
			issues.push(`runway_months=${runway_months} must be a positive number of months`);
		}
	}

	return issues;
}

/** One loaded statement entry, as the content lint sees it. */
export interface StatementEntry {
	file: string;
	draft: boolean;
	data: StatementSanityInput;
}

/**
 * Run {@link findDataInconsistencies} over every **published** (non-draft)
 * entry, returning only those with problems. Drafts are exempt so upstream
 * producers can land a statement as `draft: true` and fix its numbers before
 * flipping it live — the lint gate fires at flip-time, not before.
 */
export function findPublishedInconsistencies(
	entries: ReadonlyArray<StatementEntry>,
): Array<{ file: string; issues: string[] }> {
	return entries
		.filter((entry) => !entry.draft)
		.map((entry) => ({ file: entry.file, issues: findDataInconsistencies(entry.data) }))
		.filter((result) => result.issues.length > 0);
}
