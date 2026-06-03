import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { formatPeriodLabel } from "@/lib/statement-format/period";
import { excludeDrafts } from "@/lib/statement-format/published";
import { sortStatementsNewestFirst } from "@/lib/statement-format/sort-newest-first";

const SITE_URL = "https://ogsfrompoly.com";
const SITE_TITLE = "ogsfrompoly — statements";
const SITE_DESCRIPTION =
	"Every published ogsfrompoly statement — weekly track record and monthly project P&L, newest first.";

export const GET: APIRoute = async () => {
	const statements = sortStatementsNewestFirst(excludeDrafts(await getCollection("statements")));

	const lines = statements.map((entry) => {
		const period = formatPeriodLabel(
			entry.data.period_start,
			entry.data.period_end,
			entry.data.type,
		);
		const url = `${SITE_URL}/statements/${entry.id}.md`;
		return `- [${entry.data.title}](${url}) — ${entry.data.type} · ${period}: ${entry.data.summary}`;
	});

	const body = [
		`# ${SITE_TITLE}`,
		"",
		`> ${SITE_DESCRIPTION}`,
		"",
		"## Statements",
		"",
		lines.length === 0 ? "- _No published statements yet._" : lines.join("\n"),
		"",
	].join("\n");

	return new Response(body, {
		status: 200,
		headers: { "content-type": "text/markdown; charset=utf-8" },
	});
};
