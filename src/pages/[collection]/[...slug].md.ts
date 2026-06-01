import type { CollectionKey } from "astro:content";
import { getEntry } from "astro:content";
import type { APIRoute } from "astro";
import { markdownResponse } from "@/lib/dual-format/markdown-response";

export const GET: APIRoute = async ({ params }) => {
	const { collection, slug } = params;
	if (!collection || !slug) return markdownResponse(undefined);

	try {
		const entry = await getEntry(collection as CollectionKey, slug);
		if (entry && (entry.data as { draft?: boolean }).draft) {
			return markdownResponse(undefined);
		}
		return markdownResponse(entry);
	} catch {
		return markdownResponse(undefined);
	}
};
