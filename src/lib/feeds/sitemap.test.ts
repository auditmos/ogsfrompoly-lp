import { generateSitemap } from "./sitemap";
import type { FeedInput } from "./types";

const baseInput: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	entries: [
		{
			collection: "statements",
			slug: "2026-05-25-placeholder",
			title: "Placeholder",
			summary: "s",
			date: "2026-05-25",
			body: "",
		},
		{
			collection: "articles",
			slug: "build-log-01",
			title: "Build log 01",
			summary: "s",
			date: "2026-04-10",
			body: "",
		},
	],
};

describe("generateSitemap", () => {
	it("emits a valid sitemap.org/0.9 urlset", () => {
		const xml = generateSitemap(baseInput);

		expect(xml.startsWith("<?xml")).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
	});

	it("emits one <url> per entry with the HTML URL (no .md) and the entry date as <lastmod>", () => {
		const xml = generateSitemap(baseInput);

		expect(xml).toContain(
			"<url>\n<loc>https://ogsfrompoly.com/statements/2026-05-25-placeholder</loc>\n<lastmod>2026-05-25</lastmod>\n</url>",
		);
		expect(xml).toContain(
			"<url>\n<loc>https://ogsfrompoly.com/articles/build-log-01</loc>\n<lastmod>2026-04-10</lastmod>\n</url>",
		);
		// HTML URL only — never .md in the sitemap (RSS + llms.txt cover the .md surface)
		expect(xml).not.toContain(".md");
	});

	it("sorts <url> entries deterministically by date desc, slug asc", () => {
		const xml = generateSitemap({
			...baseInput,
			entries: [
				{
					collection: "statements",
					slug: "b-older",
					title: "t",
					summary: "s",
					date: "2026-05-10",
					body: "",
				},
				{
					collection: "statements",
					slug: "newer",
					title: "t",
					summary: "s",
					date: "2026-05-20",
					body: "",
				},
				{
					collection: "statements",
					slug: "a-older",
					title: "t",
					summary: "s",
					date: "2026-05-10",
					body: "",
				},
			],
		});

		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		expect(locs).toEqual([
			"https://ogsfrompoly.com/statements/newer",
			"https://ogsfrompoly.com/statements/a-older",
			"https://ogsfrompoly.com/statements/b-older",
		]);
	});
});
