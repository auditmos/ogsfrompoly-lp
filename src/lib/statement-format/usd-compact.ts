const MINUS = "−";

function trimTrailingZero(decimal: string): string {
	return decimal.endsWith(".0") ? decimal.slice(0, -2) : decimal;
}

function compactMagnitude(abs: number): string {
	if (abs >= 1_000_000) {
		const m = trimTrailingZero((abs / 1_000_000).toFixed(1));
		return `$${m}M`;
	}

	if (abs >= 10_000) {
		const k = trimTrailingZero((abs / 1_000).toFixed(1));
		// Rounding to one decimal can push the K value up to 1000 — roll over to M.
		if (k === "1000") return "$1M";
		return `$${k}K`;
	}

	return `$${abs.toLocaleString("en-US")}`;
}

export function formatUsdCompact(value: number): string {
	const body = compactMagnitude(Math.abs(value));
	return value < 0 ? `${MINUS}${body}` : body;
}
