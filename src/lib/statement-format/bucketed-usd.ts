const MINUS = "−";

export function bucketUsdToNearest(amount: number, bucket: number): number {
	if (bucket <= 0) throw new Error("bucket must be positive");
	// Round the magnitude then reapply the sign so ±equal amounts bucket
	// symmetrically (half rounds away from zero, not toward +∞ as Math.round does).
	const sign = amount < 0 ? -1 : 1;
	const bucketed = Math.round(Math.abs(amount) / bucket) * bucket * sign;
	return bucketed === 0 ? 0 : bucketed; // normalize -0 → 0
}

export function formatBucketedUsd(amount: number, bucket: number): string {
	const bucketed = bucketUsdToNearest(amount, bucket);
	// A value whose magnitude rounds below one bucket has an unknowable sign at
	// this precision — label it sign-neutrally rather than as a small positive.
	if (bucketed === 0) return "≈$0";
	const abs = Math.abs(bucketed).toLocaleString("en-US");
	return bucketed > 0 ? `~+$${abs}` : `~${MINUS}$${abs}`;
}
