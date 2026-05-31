import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateSitemap } from "@/lib/feeds/sitemap";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return new Response(generateSitemap(input), {
		status: 200,
		headers: { "content-type": "application/xml; charset=utf-8" },
	});
};
