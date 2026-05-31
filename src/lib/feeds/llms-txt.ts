import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput } from "./types";

function renderLine(entry: FeedEntry, siteUrl: string): string {
	const url = `${siteUrl}/${entry.collection}/${entry.slug}.md`;
	return `- [${entry.title}](${url}): ${entry.summary}`;
}

export function generateLlmsTxt(input: FeedInput): string {
	const sorted = sortEntries(input.entries);
	const collections = [...new Set(sorted.map((e) => e.collection))].sort();
	const sections = collections.map((collection) => {
		const rows = sorted
			.filter((e) => e.collection === collection)
			.map((e) => renderLine(e, input.siteUrl))
			.join("\n");
		return `## ${collection}\n\n${rows}`;
	});

	return [`# ${input.siteTitle}`, "", `> ${input.siteDescription}`, "", ...sections, ""].join("\n");
}
