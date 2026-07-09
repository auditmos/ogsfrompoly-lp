import { generateSitemap } from "./sitemap";
import type { FeedInput } from "./types";

const baseInput: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	staticPages: [],
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

	it("renders static pages ahead of content entries", () => {
		const xml = generateSitemap({
			...baseInput,
			staticPages: [
				{ path: "/", lastmod: "2026-05-25" },
				{ path: "/statements", lastmod: "2026-05-25" },
				{ path: "/methodology" },
			],
		});

		expect(xml).toContain("<loc>https://ogsfrompoly.com/</loc>");
		expect(xml).toContain("<loc>https://ogsfrompoly.com/statements</loc>");
		expect(xml).toContain("<loc>https://ogsfrompoly.com/methodology</loc>");

		// static pages come before the first content entry
		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		expect(locs.slice(0, 3)).toEqual([
			"https://ogsfrompoly.com/",
			"https://ogsfrompoly.com/statements",
			"https://ogsfrompoly.com/methodology",
		]);
	});

	it("emits <lastmod> for dated static pages and omits it for undated ones", () => {
		const xml = generateSitemap({
			...baseInput,
			staticPages: [{ path: "/", lastmod: "2026-05-25" }, { path: "/methodology" }],
		});

		expect(xml).toContain(
			"<url>\n<loc>https://ogsfrompoly.com/</loc>\n<lastmod>2026-05-25</lastmod>\n</url>",
		);
		// /methodology has no lastmod — the <url> block must contain no <lastmod> at all
		expect(xml).toContain("<url>\n<loc>https://ogsfrompoly.com/methodology</loc>\n</url>");
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
