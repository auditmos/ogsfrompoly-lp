export function formatContributionPercent(walletPnl: number, totalPnl: number): string | null {
	if (totalPnl === 0) return null;
	const pct = Math.round((walletPnl / totalPnl) * 100);
	// A wallet's contribution can exceed the headline PnL because the headline
	// nets in hundreds of other (often negative) alerts. Show the direction, not
	// an alarming out-of-range literal; the caption explains why it can happen.
	if (pct > 100) return ">100%";
	if (pct < -100) return "<-100%";
	return `${pct}%`;
}
