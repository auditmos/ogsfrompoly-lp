export type BeaconAttributes = {
	src: string;
	defer: true;
	dataCfBeacon: string;
};

export function buildBeaconAttributes(token: string | undefined): BeaconAttributes | null {
	const trimmed = token?.trim();
	if (!trimmed) return null;
	return {
		src: "https://static.cloudflareinsights.com/beacon.min.js",
		defer: true,
		dataCfBeacon: JSON.stringify({ token: trimmed }),
	};
}
