import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateRss } from "@/lib/feeds/rss";
import { cachedResponse } from "@/lib/http/cached-response";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return cachedResponse(generateRss(input), {
		contentType: "application/rss+xml; charset=utf-8",
	});
};
