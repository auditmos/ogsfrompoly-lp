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

/** The frontmatter fields the cross-field checks read. */
export interface StatementSanityInput {
	type?: string;
	alert_count: number;
	hit_rate: number;
	hypothetical_pnl_usd: number;
	bankroll_usd: number;
	top_wallets?: ReadonlyArray<{ hypothetical_pnl_usd?: number }>;
	pnl?: { revenue_usd: number; opex_usd: number; net_usd: number };
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

	// Monthly P&L must balance: net = revenue - opex (opex stored as a positive
	// magnitude, per docs/statement-schema.md). Tolerate float noise.
	if (data.pnl) {
		const { revenue_usd, opex_usd, net_usd } = data.pnl;
		if (Math.abs(net_usd - (revenue_usd - opex_usd)) > 1e-6) {
			issues.push(
				`pnl.net_usd=${net_usd} != revenue_usd - opex_usd (${revenue_usd} - ${opex_usd} = ${revenue_usd - opex_usd})`,
			);
		}
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
