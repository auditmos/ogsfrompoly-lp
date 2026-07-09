import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateLlmsTxt } from "@/lib/feeds/llms-txt";
import { cachedResponse } from "@/lib/http/cached-response";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return cachedResponse(generateLlmsTxt(input), {
		contentType: "text/markdown; charset=utf-8",
	});
};
