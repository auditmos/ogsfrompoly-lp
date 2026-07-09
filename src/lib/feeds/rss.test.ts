import { generateRss } from "./rss";
import type { FeedEntry, FeedInput } from "./types";

const placeholderEntry: FeedEntry = {
	collection: "statements",
	slug: "2026-05-25-placeholder",
	title: "Placeholder weekly statement",
	summary: "Schema-exercise fixture.",
	date: "2026-05-25",
	body: "# hello\n\nworld\n",
};

const baseInput: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	staticPages: [],
	entries: [placeholderEntry],
};

describe("generateRss", () => {
	it("emits a valid RSS 2.0 channel for the given site input", () => {
		const xml = generateRss(baseInput);

		expect(xml.startsWith("<?xml")).toBe(true);
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain("<channel>");
		expect(xml).toContain("<title>ogsfrompoly</title>");
		expect(xml).toContain(
			"<description>We measure who is actually skilled on Polymarket.</description>",
		);
		expect(xml).toContain("<link>https://ogsfrompoly.com</link>");
	});

	it("declares the channel language as en", () => {
		const xml = generateRss(baseInput);

		expect(xml).toContain("<language>en</language>");
	});

	it("declares the atom namespace and a self-referential atom:link", () => {
		const xml = generateRss(baseInput);

		expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
		expect(xml).toContain(
			'<atom:link href="https://ogsfrompoly.com/rss.xml" rel="self" type="application/rss+xml"/>',
		);
	});

	it("sets lastBuildDate to the newest entry's pubDate (never build time)", () => {
		const xml = generateRss({
			...baseInput,
			entries: [
				{
					collection: "statements",
					slug: "older",
					title: "Older",
					summary: "s",
					date: "2026-05-25",
					body: "",
				},
				{
					collection: "statements",
					slug: "newest",
					title: "Newest",
					summary: "s",
					date: "2026-05-31",
					body: "",
				},
			],
		});

		expect(xml).toContain("<lastBuildDate>Sun, 31 May 2026 00:00:00 GMT</lastBuildDate>");
	});

	it("emits one <item> per entry with title, link and pubDate", () => {
		const xml = generateRss(baseInput);

		expect(xml).toContain("<item>");
		expect(xml).toContain("<title>Placeholder weekly statement</title>");
		expect(xml).toContain("<link>https://ogsfrompoly.com/statements/2026-05-25-placeholder</link>");
		expect(xml).toContain(
			'<guid isPermaLink="true">https://ogsfrompoly.com/statements/2026-05-25-placeholder</guid>',
		);
		// RFC 822 pubDate derived from the entry's date — no time-of-day inference
		expect(xml).toMatch(/<pubDate>Mon, 25 May 2026 00:00:00 GMT<\/pubDate>/);
	});

	it("sorts items by date descending with slug descending as tiebreak", () => {
		const xml = generateRss({
			...baseInput,
			entries: [
				{
					collection: "statements",
					slug: "b-older",
					title: "Older B",
					summary: "s",
					date: "2026-05-10",
					body: "",
				},
				{
					collection: "statements",
					slug: "newer",
					title: "Newer",
					summary: "s",
					date: "2026-05-20",
					body: "",
				},
				{
					collection: "statements",
					slug: "a-older",
					title: "Older A",
					summary: "s",
					date: "2026-05-10",
					body: "",
				},
			],
		});

		const orderedTitles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)]
			.map((m) => m[1])
			.filter((t): t is string => t !== undefined && t !== "ogsfrompoly");

		expect(orderedTitles).toEqual(["Newer", "Older B", "Older A"]);
	});

	it("XML-escapes <, >, & in titles, descriptions, and the channel header", () => {
		const xml = generateRss({
			siteUrl: "https://ogsfrompoly.com",
			siteTitle: "ogs & friends <beta>",
			siteDescription: "alerts & outcomes",
			staticPages: [],
			entries: [
				{
					collection: "statements",
					slug: "weird",
					title: "P&L > expected",
					summary: "uses <html> & such",
					date: "2026-05-25",
					body: "",
				},
			],
		});

		expect(xml).toContain("<title>ogs &amp; friends &lt;beta&gt;</title>");
		expect(xml).toContain("<description>alerts &amp; outcomes</description>");
		expect(xml).toContain("<title>P&amp;L &gt; expected</title>");
		expect(xml).toContain("<description>uses &lt;html&gt; &amp; such</description>");
	});

	it("escapes a ]]> sequence inside the body using the canonical CDATA split", () => {
		const xml = generateRss({
			...baseInput,
			entries: [
				{
					...placeholderEntry,
					body: "before ]]> after",
				},
			],
		});

		// canonical split-escape — closes the CDATA, emits ]]>, reopens a new CDATA
		expect(xml).toContain("<![CDATA[before ]]]]><![CDATA[> after]]></content:encoded>");
	});

	it("emits content:encoded with the full body wrapped in CDATA", () => {
		const xml = generateRss({
			...baseInput,
			entries: [
				{
					...placeholderEntry,
					body: "# Real body\n\nA paragraph with <html> & ampersands.\n",
				},
			],
		});

		// xmlns:content declared on rss element so content:encoded is valid
		expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
		expect(xml).toContain(
			"<content:encoded><![CDATA[# Real body\n\nA paragraph with <html> & ampersands.\n]]></content:encoded>",
		);
	});
});
