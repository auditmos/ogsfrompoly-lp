/** Browser-held TTL (seconds). A poll within this window never leaves the client. */
const BROWSER_TTL_SECONDS = 300;

/**
 * Cloudflare edge TTL (seconds) — the post-publish visibility bound. A newly
 * published statement is guaranteed to appear at the edge within this window,
 * even against a warm cache, with no deploy-time purge. Content changes at most
 * weekly, so a 1h edge cache is conservative. See issue #37.
 */
export const EDGE_TTL_SECONDS = 3600;

/** Window in which the edge may serve a stale copy while it revalidates (seconds). */
const STALE_WHILE_REVALIDATE_SECONDS = 86400;

/** The single tunable cache policy for every cacheable feed, `.md`, and HTML response. */
export const FEED_CACHE_CONTROL = `public, max-age=${BROWSER_TTL_SECONDS}, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;

/** Opt a response out of every cache — used for 404s so a miss is never cached. */
export const NO_STORE_CACHE_CONTROL = "no-store";

export interface CachedResponseInit {
	contentType: string;
	/** Defaults to 200. */
	status?: number;
	/** Defaults to {@link FEED_CACHE_CONTROL}; pass {@link NO_STORE_CACHE_CONTROL} for errors. */
	cacheControl?: string;
}

export function cachedResponse(body: BodyInit | null, init: CachedResponseInit): Response {
	return new Response(body, {
		status: init.status ?? 200,
		headers: {
			"content-type": init.contentType,
			"cache-control": init.cacheControl ?? FEED_CACHE_CONTROL,
		},
	});
}
