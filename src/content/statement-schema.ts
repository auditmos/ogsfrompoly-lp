import { z } from "zod";

/**
 * Stable cross-repo contract marker. The upstream `ogsfrompoly` CLI emits
 * statements declaring this version; producers and consumers must agree.
 *
 * Bumping this is a breaking change — coordinate with ogsfrompoly before
 * widening, narrowing, or renaming required fields. See
 * `docs/statement-schema.md` for the full version-bump protocol.
 */
export const SCHEMA_VERSION = 1 as const;

/**
 * A `YYYY-MM-DD` string that also names a real calendar day. The regex alone
 * lets impossible dates (`2026-02-31`, `2026-13-01`, `2026-00-00`) through;
 * downstream that renders "undefined 2026" labels and silently shifts RSS
 * pubDates. Round-trip through `Date.UTC` and require the components to survive.
 */
function isRealCalendarDate(iso: string): boolean {
	const [y, m, d] = iso.split("-").map(Number);
	const ts = Date.UTC(y, m - 1, d);
	const back = new Date(ts);
	return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d;
}

const isoDate = z.preprocess(
	(v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
	z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "expected ISO date YYYY-MM-DD")
		.refine(isRealCalendarDate, "not a real calendar date"),
);

const category = z.enum(["politics", "macro-finance", "crypto"]);

const truncatedWalletId = z
	.string()
	.min(1)
	.max(32, "truncated_id must be ≤ 32 chars; full addresses are not permitted")
	.refine((s) => !/0x[0-9a-f]{40}/i.test(s), {
		message: "truncated_id must not contain a full EVM address",
	});

const truncatedWallet = z.object({
	truncated_id: truncatedWalletId,
	category,
	hypothetical_pnl_usd: z.number().optional(),
});

const sharedFields = {
	schema_version: z.literal(SCHEMA_VERSION),
	title: z.string().min(1),
	summary: z.string().min(1),
	period_start: isoDate,
	period_end: isoDate,
	bankroll_usd: z.number().positive(),
	alert_count: z.number().int().nonnegative(),
	hit_rate: z.number().min(0).max(1),
	hypothetical_pnl_usd: z.number(),
	categories: z
		.array(category)
		.min(1)
		.refine((v) => new Set(v).size === v.length, "categories must not contain duplicates"),
	top_wallets: z.array(truncatedWallet),
	draft: z.boolean().default(false),
} as const;

const weeklyStatement = z.object({
	...sharedFields,
	type: z.literal("weekly"),
});

const monthlyPnl = z.object({
	revenue_usd: z.number(),
	opex_usd: z.number(),
	net_usd: z.number(),
	runway_months: z.number().nullable(),
});

const monthlyStatement = z.object({
	...sharedFields,
	type: z.literal("monthly"),
	pnl: monthlyPnl,
});

export const statementSchema = z
	.discriminatedUnion("type", [weeklyStatement, monthlyStatement])
	.refine((s) => s.period_start <= s.period_end, {
		message: "period_start must be on or before period_end",
		path: ["period_end"],
	});
