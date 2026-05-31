import { buildBeaconAttributes } from "./cloudflare-beacon";

describe("buildBeaconAttributes", () => {
	it("returns null when no token is provided", () => {
		expect(buildBeaconAttributes(undefined)).toBeNull();
	});

	it.each([
		{ name: "empty string", token: "" },
		{ name: "whitespace-only", token: "   " },
		{ name: "tab", token: "\t" },
	])("returns null when the token is $name (avoids shipping a useless beacon)", ({ token }) => {
		expect(buildBeaconAttributes(token)).toBeNull();
	});

	it("returns the cookieless Cloudflare beacon script attributes when a token is present", () => {
		const attrs = buildBeaconAttributes("abc123token");

		expect(attrs).not.toBeNull();
		expect(attrs).toEqual({
			src: "https://static.cloudflareinsights.com/beacon.min.js",
			defer: true,
			dataCfBeacon: '{"token":"abc123token"}',
		});
	});
});
