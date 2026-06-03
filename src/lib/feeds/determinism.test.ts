import { generateLlmsTxt } from "./llms-txt";
import { generateRss } from "./rss";
import { generateSitemap } from "./sitemap";
import type { FeedInput } from "./types";

// A two-collection fixture (statements + fictional articles) used to prove
// AC #4 (deterministic, reviewable diffs) and AC #5 (a fictional 2nd
// collection appears in all 3 feeds without generator-side changes).
const fixture: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	entries: [
		{
			collection: "statements",
			slug: "2026-05-25-weekly",
			title: "Week of May 19, 2026",
			summary: "142 alerts, hit rate 0.58.",
			date: "2026-05-25",
			body: "# Week of May 19\n\nBody.\n",
		},
		{
			collection: "statements",
			slug: "2026-05-31-monthly",
			title: "May 2026",
			summary: "612 alerts, hit rate 0.55.",
			date: "2026-05-31",
			body: "# May 2026\n\nBody.\n",
		},
		{
			collection: "articles",
			slug: "build-log-01",
			title: "Build log 01: warehouse",
			summary: "How we provisioned the warehouse.",
			date: "2026-04-10",
			body: "# Build log 01\n\nBody.\n",
		},
	],
};

describe("feed determinism (Phase 1 / Slice 3 invariant)", () => {
	it("generateRss output is byte-identical across repeated invocations", () => {
		expect(generateRss(fixture)).toBe(generateRss(fixture));
	});

	it("generateLlmsTxt output is byte-identical across repeated invocations", () => {
		expect(generateLlmsTxt(fixture)).toBe(generateLlmsTxt(fixture));
	});

	it("generateSitemap output is byte-identical across repeated invocations", () => {
		expect(generateSitemap(fixture)).toBe(generateSitemap(fixture));
	});

	it("a fictional 'articles' collection appears in all three feeds without generator-module changes", () => {
		const rss = generateRss(fixture);
		const llms = generateLlmsTxt(fixture);
		const sitemap = generateSitemap(fixture);

		expect(rss).toContain("/articles/build-log-01");
		expect(llms).toContain("## articles");
		expect(llms).toContain("/articles/build-log-01.md");
		expect(sitemap).toContain("/articles/build-log-01");
	});

	it("locks the RSS output as a reviewable snapshot", () => {
		expect(generateRss(fixture)).toMatchInlineSnapshot(`
			"<?xml version="1.0" encoding="UTF-8"?>
			<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
			<channel>
			<title>ogsfrompoly</title>
			<link>https://ogsfrompoly.com</link>
			<description>We measure who is actually skilled on Polymarket.</description>
			<item>
			<title>May 2026</title>
			<link>https://ogsfrompoly.com/statements/2026-05-31-monthly</link>
			<guid isPermaLink="true">https://ogsfrompoly.com/statements/2026-05-31-monthly</guid>
			<pubDate>Sun, 31 May 2026 00:00:00 GMT</pubDate>
			<description>612 alerts, hit rate 0.55.</description>
			<content:encoded><![CDATA[# May 2026

			Body.
			]]></content:encoded>
			</item>
			<item>
			<title>Week of May 19, 2026</title>
			<link>https://ogsfrompoly.com/statements/2026-05-25-weekly</link>
			<guid isPermaLink="true">https://ogsfrompoly.com/statements/2026-05-25-weekly</guid>
			<pubDate>Mon, 25 May 2026 00:00:00 GMT</pubDate>
			<description>142 alerts, hit rate 0.58.</description>
			<content:encoded><![CDATA[# Week of May 19

			Body.
			]]></content:encoded>
			</item>
			<item>
			<title>Build log 01: warehouse</title>
			<link>https://ogsfrompoly.com/articles/build-log-01</link>
			<guid isPermaLink="true">https://ogsfrompoly.com/articles/build-log-01</guid>
			<pubDate>Fri, 10 Apr 2026 00:00:00 GMT</pubDate>
			<description>How we provisioned the warehouse.</description>
			<content:encoded><![CDATA[# Build log 01

			Body.
			]]></content:encoded>
			</item>
			</channel>
			</rss>
			"
		`);
	});

	it("locks the llms.txt output as a reviewable snapshot", () => {
		expect(generateLlmsTxt(fixture)).toMatchInlineSnapshot(`
			"# ogsfrompoly

			> We measure who is actually skilled on Polymarket.

			## Browse all

			- [All statements](https://ogsfrompoly.com/statements.md): Index of every published statement — weekly track record and monthly project P&L, newest first.

			## Methodology

			- [Methodology](https://ogsfrompoly.com/methodology.md): How ogsfrompoly tests Polymarket wallets for repeatable skill, scores retrospective alerts, and decides what is safe to publish.

			## articles

			- [Build log 01: warehouse](https://ogsfrompoly.com/articles/build-log-01.md): How we provisioned the warehouse.
			## statements

			- [May 2026](https://ogsfrompoly.com/statements/2026-05-31-monthly.md): 612 alerts, hit rate 0.55.
			- [Week of May 19, 2026](https://ogsfrompoly.com/statements/2026-05-25-weekly.md): 142 alerts, hit rate 0.58.
			"
		`);
	});

	it("locks the sitemap.xml output as a reviewable snapshot", () => {
		expect(generateSitemap(fixture)).toMatchInlineSnapshot(`
			"<?xml version="1.0" encoding="UTF-8"?>
			<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
			<url>
			<loc>https://ogsfrompoly.com/statements/2026-05-31-monthly</loc>
			<lastmod>2026-05-31</lastmod>
			</url>
			<url>
			<loc>https://ogsfrompoly.com/statements/2026-05-25-weekly</loc>
			<lastmod>2026-05-25</lastmod>
			</url>
			<url>
			<loc>https://ogsfrompoly.com/articles/build-log-01</loc>
			<lastmod>2026-04-10</lastmod>
			</url>
			</urlset>
			"
		`);
	});
});
