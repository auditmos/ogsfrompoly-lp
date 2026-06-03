const MINUS = "−";

export function bucketUsdToNearest(amount: number, bucket: number): number {
	if (bucket <= 0) throw new Error("bucket must be positive");
	return Math.round(amount / bucket) * bucket;
}

export function formatBucketedUsd(amount: number, bucket: number): string {
	const bucketed = bucketUsdToNearest(amount, bucket);
	if (bucketed === 0) return `<$${bucket.toLocaleString("en-US")}`;
	const abs = Math.abs(bucketed).toLocaleString("en-US");
	return bucketed > 0 ? `~+$${abs}` : `~${MINUS}$${abs}`;
}
