import {
	cachedResponse,
	EDGE_TTL_SECONDS,
	FEED_CACHE_CONTROL,
	NO_STORE_CACHE_CONTROL,
} from "./cached-response";

describe("cachedResponse", () => {
	it("returns a 200 with the content-type and the feed Cache-Control policy", () => {
		const response = cachedResponse("<rss/>", {
			contentType: "application/rss+xml; charset=utf-8",
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
		);
	});

	it("passes the body through byte-for-byte", async () => {
		const body = "# Statement — May 19–25\n\nUnicode: π, ✓, 日本語\nTrailing space:   \nNo newline";
		const response = cachedResponse(body, { contentType: "text/markdown; charset=utf-8" });

		expect(await response.text()).toBe(body);
	});

	it("honors a status override and a no-store directive for uncacheable responses", () => {
		const response = cachedResponse("Not Found", {
			contentType: "text/plain; charset=utf-8",
			status: 404,
			cacheControl: NO_STORE_CACHE_CONTROL,
		});

		expect(response.status).toBe(404);
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	// The edge TTL is the post-publish visibility bound: a newly published
	// statement is guaranteed to appear at the edge within EDGE_TTL_SECONDS,
	// even against a warm cache, with no deploy-time purge. Content changes at
	// most weekly, so 1h is conservative. Change this deliberately.
	it("caps post-publish staleness at the documented one-hour edge bound", () => {
		expect(EDGE_TTL_SECONDS).toBe(3600);
		expect(FEED_CACHE_CONTROL).toContain(`s-maxage=${EDGE_TTL_SECONDS}`);
	});
});
