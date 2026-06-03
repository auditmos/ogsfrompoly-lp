import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput } from "./types";

const METHODOLOGY_SUMMARY =
	"How ogsfrompoly tests Polymarket wallets for repeatable skill, scores retrospective alerts, and decides what is safe to publish.";

const STATEMENTS_INDEX_SUMMARY =
	"Index of every published statement — weekly track record and monthly project P&L, newest first.";

function renderLine(entry: FeedEntry, siteUrl: string): string {
	const url = `${siteUrl}/${entry.collection}/${entry.slug}.md`;
	return `- [${entry.title}](${url}): ${entry.summary}`;
}

function renderMethodologyLine(siteUrl: string): string {
	return `- [Methodology](${siteUrl}/methodology.md): ${METHODOLOGY_SUMMARY}`;
}

function renderStatementsIndexLine(siteUrl: string): string {
	return `- [All statements](${siteUrl}/statements.md): ${STATEMENTS_INDEX_SUMMARY}`;
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

	return [
		`# ${input.siteTitle}`,
		"",
		`> ${input.siteDescription}`,
		"",
		"## Browse all",
		"",
		renderStatementsIndexLine(input.siteUrl),
		"",
		"## Methodology",
		"",
		renderMethodologyLine(input.siteUrl),
		"",
		...sections,
		"",
	].join("\n");
}
