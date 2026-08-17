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

/**
 * The venue's platform-fee rate. The fee is charged **per share** and scaled by
 * `price * (1 - price)`, so as a share of the *ticket* it collapses to
 * `rate * (1 - price)` — monotonically decreasing in price. A cheap outcome is
 * the expensive one to trade, because a fixed ticket buys proportionally more
 * shares.
 *
 * 5% is what Polymarket served on every fee-bearing market sampled 2026-07-30;
 * one market quoted 4%, and half served no fee at all. One rate is enough for
 * the walkthroughs — the executors read each market's own curve when they can,
 * and fall back to this when they cannot.
 */
export const VENUE_FEE_RATE = 0.05;

/** Decimal places the venue's charged fee lands on. */
const FEE_QUANTUM_DECIMALS = 5;

/**
 * `value` shifted `places` decimal digits left, truncated to an integer, in
 * exact decimal arithmetic on the number's shortest round-tripping form — the
 * figure `Decimal(str(x))` takes upstream.
 *
 * Multiplying the double instead would be wrong in the direction that matters:
 * `0.1615 * 1e5` is `16149.999999999998` in IEEE, so a naive floor would knock
 * an exact grid point down a whole quantum.
 */
function truncateShifted(value: number, places: number): bigint {
	const [mantissa, exponentText] = value.toExponential().split("e");
	const digits = (mantissa ?? "0").replace(".", "");
	// Where the decimal point sits after the shift, counted from the right.
	const pointFromRight = digits.length - 1 - Number(exponentText ?? "0") - places;
	if (pointFromRight <= 0) return BigInt(digits) * 10n ** BigInt(-pointFromRight);
	// BigInt division truncates toward zero, and the caller guards `value > 0`.
	return BigInt(digits) / 10n ** BigInt(pointFromRight);
}

/**
 * What the venue charges on one fill, snapped onto its money grid.
 *
 * **Truncates**, measured rather than assumed: the eleventh of eleven live
 * settlements reconciled only this way — `0.164999976` would round to
 * `0.165000`, and the wallet was charged `0.164990`.
 */
export function platformFeeUsdc(shares: number, price: number, rate = VENUE_FEE_RATE): number {
	if (shares <= 0 || rate <= 0 || price <= 0 || price >= 1) return 0;
	// The venue's curve first — `p * (1 - p)`, then the rate, then the shares —
	// because the grouping decides the last bit and truncation cannot forgive it.
	// At 12.5 shares and $0.30, folding the shares in earlier lands on
	// 0.13124999999999998, a whole quantum low once truncated.
	const fee = shares * (rate * (price * (1 - price)));
	if (fee <= 0) return 0;
	return Number(truncateShifted(fee, FEE_QUANTUM_DECIMALS)) / 10 ** FEE_QUANTUM_DECIMALS;
}
