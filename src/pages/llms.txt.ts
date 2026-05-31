import type { APIRoute } from "astro";
import { collectFeedInput } from "@/lib/feeds/collect";
import { generateLlmsTxt } from "@/lib/feeds/llms-txt";

export const GET: APIRoute = async () => {
	const input = await collectFeedInput();
	return new Response(generateLlmsTxt(input), {
		status: 200,
		headers: { "content-type": "text/markdown; charset=utf-8" },
	});
};
