import { sortStatementsNewestFirst } from "@/lib/statement-format/sort-newest-first";
import { generateLlmsTxt } from "./llms-txt";
import { generateRss } from "./rss";
import { generateSitemap } from "./sitemap";
import type { FeedInput } from "./types";

// The 2026-05-31 pair that shipped to prod: a weekly and a monthly statement
// sharing a period_end. Before issue #38 the surfaces disagreed — /statements
// listed monthly first (id desc), RSS listed weekly first (slug asc).
const CANONICAL = [
	{
		slug: "2026-05-31-weekly",
		date: "2026-05-31",
		title: "Week of 2026-05-25",
		summary: "weekly statement",
		body: "# weekly\n",
	},
	{
		slug: "2026-05-monthly",
		date: "2026-05-31",
		title: "May 2026",
		summary: "monthly statement",
		body: "# monthly\n",
	},
];

const statementEntries = CANONICAL.map((e) => ({ id: e.slug, data: { period_end: e.date } }));

const feedInput: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	staticPages: [],
	entries: CANONICAL.map((e) => ({
		collection: "statements",
		slug: e.slug,
		title: e.title,
		summary: e.summary,
		date: e.date,
		body: e.body,
	})),
};

function statementSlugs(text: string, re: RegExp): string[] {
	return [...text.matchAll(re)].map((m) => m[1] ?? "");
}

const RSS_LINK = /<link>[^<]*\/statements\/([^<]+)<\/link>/g;
const SITEMAP_LOC = /<loc>[^<]*\/statements\/([^<]+)<\/loc>/g;
const LLMS_MD = /\/statements\/([^.\s)]+)\.md/g;

describe("same-date entries order identically across every surface (issue #38 AC3)", () => {
	// The one canonical order: period_end desc, then slug/id desc.
	const canonicalOrder = sortStatementsNewestFirst(statementEntries).map((e) => e.id);

	it("resolves the 2026-05-31 pair to monthly-before-weekly", () => {
		expect(canonicalOrder).toEqual(["2026-05-monthly", "2026-05-31-weekly"]);
	});

	it("RSS emits the entries in the canonical order", () => {
		expect(statementSlugs(generateRss(feedInput), RSS_LINK)).toEqual(canonicalOrder);
	});

	it("llms.txt emits the entries in the canonical order", () => {
		expect(statementSlugs(generateLlmsTxt(feedInput), LLMS_MD)).toEqual(canonicalOrder);
	});

	it("sitemap emits the entries in the canonical order", () => {
		expect(statementSlugs(generateSitemap(feedInput), SITEMAP_LOC)).toEqual(canonicalOrder);
	});
});
