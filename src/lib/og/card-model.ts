import { SITE_TITLE, SITE_URL } from "@/lib/site/config";
import { formatPercent } from "@/lib/statement-format/percent";
import { formatPeriodLabel } from "@/lib/statement-format/period";
import { formatSignedUsd } from "@/lib/statement-format/signed-usd";
import type { Statement } from "@/lib/statement-format/statement-data";

/**
 * View model for a social card. This is the *only* thing the renderer draws, so
 * it is deliberately the disclosure boundary: `buildStatementCardModel` reads
 * exclusively aggregate statement fields and never `top_wallets`, so no
 * per-wallet id, bucket, or address can ever reach a public, cacheable,
 * widely-reshared image. Keep it that way — see `CLAUDE.md` disclosure policy.
 */
export type CardStatTone = "default" | "accent" | "loss";

export interface CardStat {
	label: string;
	value: string;
	tone: CardStatTone;
}

export interface CardModel {
	variant: "brand" | "statement";
	eyebrow: string;
	title: string;
	/** Present only on the brand card; statement cards lead with their stats. */
	tagline?: string;
	stats: CardStat[];
	footer: string;
}

const FOOTER_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

/** Tone by sign, sharing `formatSignedUsd`'s rounding so a value that rounds to
 * zero reads as neutral rather than a phantom gain/loss. */
function signedTone(value: number): CardStatTone {
	const rounded = Math.round(value);
	if (rounded > 0) return "accent";
	if (rounded < 0) return "loss";
	return "default";
}

/** The static brand card shown on every non-statement page. */
export const BRAND_CARD_MODEL: CardModel = {
	variant: "brand",
	eyebrow: "POLYMARKET SKILLED-TRADER DETECTION",
	title: SITE_TITLE,
	tagline: "We measure who is actually skilled on Polymarket — and we show our work, weekly.",
	stats: [],
	footer: FOOTER_DOMAIN,
};

/** Builds the disclosure-safe, aggregate-only card model for a statement. */
export function buildStatementCardModel(statement: Statement): CardModel {
	return {
		variant: "statement",
		eyebrow: `${statement.type.toUpperCase()} · ${formatPeriodLabel(
			statement.period_start,
			statement.period_end,
			statement.type,
		)}`,
		title: statement.title,
		stats: [
			{ label: "Hit rate", value: formatPercent(statement.hit_rate), tone: "default" },
			{
				label: "Hypo. PnL",
				value: formatSignedUsd(statement.hypothetical_pnl_usd),
				tone: signedTone(statement.hypothetical_pnl_usd),
			},
			{ label: "Alerts", value: String(statement.alert_count), tone: "default" },
		],
		footer: FOOTER_DOMAIN,
	};
}
