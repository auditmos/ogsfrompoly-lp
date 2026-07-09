import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateSitemap } from "@/lib/feeds/sitemap";
import { cachedResponse } from "@/lib/http/cached-response";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return cachedResponse(generateSitemap(input), {
		contentType: "application/xml; charset=utf-8",
	});
};
