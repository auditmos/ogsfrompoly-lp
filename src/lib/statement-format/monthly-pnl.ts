import { formatSignedUsd } from "./signed-usd";

export interface MonthlyPnl {
	revenue_usd: number;
	opex_usd: number;
	net_usd: number;
	runway_months: number | null;
}

export type PnlTone = "default" | "accent" | "loss";

export interface PnlRow {
	label: string;
	value: string;
	tone: PnlTone;
}

/**
 * Tone by sign, sharing `formatSignedUsd`'s rounding so a value that rounds to
 * zero (e.g. −0.4 → "$0") reads as neutral rather than a phantom loss.
 */
function signedTone(value: number): PnlTone {
	const rounded = Math.round(value);
	if (rounded > 0) return "accent";
	if (rounded < 0) return "loss";
	return "default";
}

export function monthlyPnlRows(pnl: MonthlyPnl): PnlRow[] {
	return [
		{
			label: "Revenue",
			value: formatSignedUsd(pnl.revenue_usd),
			tone: signedTone(pnl.revenue_usd),
		},
		{ label: "Opex", value: formatSignedUsd(pnl.opex_usd), tone: signedTone(pnl.opex_usd) },
		{ label: "Net", value: formatSignedUsd(pnl.net_usd), tone: signedTone(pnl.net_usd) },
		{ label: "Runway", value: formatRunway(pnl.runway_months), tone: "default" },
	];
}

function formatRunway(months: number | null): string {
	if (months === null) return "covered";
	return `${months} mo.`;
}
