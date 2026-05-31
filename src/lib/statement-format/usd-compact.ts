function trimTrailingZero(decimal: string): string {
	return decimal.endsWith(".0") ? decimal.slice(0, -2) : decimal;
}

export function formatUsdCompact(value: number): string {
	const abs = Math.abs(value);

	if (abs >= 1_000_000) {
		const m = trimTrailingZero((value / 1_000_000).toFixed(1));
		return `$${m}M`;
	}

	if (abs >= 10_000) {
		const k = trimTrailingZero((value / 1_000).toFixed(1));
		return `$${k}K`;
	}

	return `$${value.toLocaleString("en-US")}`;
}
