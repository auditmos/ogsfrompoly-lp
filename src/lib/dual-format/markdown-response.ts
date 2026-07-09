import YAML from "yaml";
import { cachedResponse, NO_STORE_CACHE_CONTROL } from "@/lib/http/cached-response";

export type MarkdownEntry = {
	body?: string | undefined;
	/**
	 * Validated frontmatter for the entry. Astro's glob loader strips the raw
	 * frontmatter from `body`, so we re-serialize the parsed `data` here — this is
	 * the LLM-facing surface (`llms.txt` subscribers) and it must carry every
	 * number the HTML shows. Collection-agnostic: any shape serializes the same way.
	 */
	data?: Record<string, unknown> | undefined;
};

/**
 * Serialize validated frontmatter deterministically. `sortMapEntries` gives a
 * stable recursive key order regardless of on-disk key order, so the emitted
 * `.md` is byte-identical across invocations (feeds snapshot invariant).
 */
function serializeFrontmatter(data: Record<string, unknown>): string {
	return `---\n${YAML.stringify(data, { sortMapEntries: true })}---\n`;
}

export function markdownResponse(entry: MarkdownEntry | undefined): Response {
	if (!entry || entry.body === undefined) {
		return cachedResponse("Not Found", {
			contentType: "text/plain; charset=utf-8",
			status: 404,
			cacheControl: NO_STORE_CACHE_CONTROL,
		});
	}

	const hasData = entry.data !== undefined && Object.keys(entry.data).length > 0;
	const text = hasData
		? `${serializeFrontmatter(entry.data as Record<string, unknown>)}${entry.body}`
		: entry.body;

	return cachedResponse(text, { contentType: "text/markdown; charset=utf-8" });
}
