/**
 * Venue price arithmetic shared by both simulators: two-outcome complement
 * prices and the exchange's quoting grid. Pure and float-hygienic — every
 * result is rounded back onto a sane number of decimals so `1 - 0.905` cannot
 * leak `0.09499…` into a readout or a comparison.
 */

export function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/** The other outcome's price. Rounded because `1 - 0.905` is `0.09499…`. */
export function complement(price: number): number {
	return roundTo(1 - price, 4);
}

/**
 * Round a limit down onto the market's price grid, then keep it inside the
 * venue's own bounds. Down, not nearest: rounding up would let a fill land
 * outside the slippage the operator configured.
 */
export function snapDown(price: number, tick: number): number {
	if (tick <= 0) return price;
	const steps = Math.floor(roundTo(price / tick, 6));
	const snapped = roundTo(steps * tick, 4);
	return Math.min(Math.max(snapped, tick), complement(tick));
}
