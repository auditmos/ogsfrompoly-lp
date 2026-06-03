export function formatContributionPercent(walletPnl: number, totalPnl: number): string | null {
	if (totalPnl === 0) return null;
	const pct = Math.round((walletPnl / totalPnl) * 100);
	return `${pct}%`;
}
