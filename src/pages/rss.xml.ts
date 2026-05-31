import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateRss } from "@/lib/feeds/rss";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return new Response(generateRss(input), {
		status: 200,
		headers: { "content-type": "application/rss+xml; charset=utf-8" },
	});
};
