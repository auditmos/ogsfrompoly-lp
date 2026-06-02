import { generateLlmsTxt } from "./llms-txt";
import type { FeedInput } from "./types";

const baseInput: FeedInput = {
	siteUrl: "https://ogsfrompoly.com",
	siteTitle: "ogsfrompoly",
	siteDescription: "We measure who is actually skilled on Polymarket.",
	entries: [
		{
			collection: "statements",
			slug: "2026-05-25-placeholder",
			title: "Placeholder weekly statement",
			summary: "Schema-exercise fixture.",
			date: "2026-05-25",
			body: "",
		},
	],
};

describe("generateLlmsTxt", () => {
	it("opens with site title and one-line site description in llms.txt format", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt.startsWith("# ogsfrompoly\n")).toBe(true);
		expect(txt).toContain("> We measure who is actually skilled on Polymarket.");
	});

	it("groups entries under a heading per collection (no generator-side changes for new collections)", () => {
		const txt = generateLlmsTxt({
			...baseInput,
			entries: [
				...baseInput.entries,
				{
					collection: "articles",
					slug: "build-log-01",
					title: "Build log 01",
					summary: "How we set up the warehouse.",
					date: "2026-04-10",
					body: "",
				},
			],
		});

		const articlesIdx = txt.indexOf("## articles");
		const methodologyIdx = txt.indexOf("## Methodology");
		const statementsIdx = txt.indexOf("## statements");
		expect(articlesIdx).toBeGreaterThan(-1);
		expect(methodologyIdx).toBeGreaterThan(-1);
		expect(statementsIdx).toBeGreaterThan(-1);
		// Methodology is pinned before collection sections; collections stay alphabetical.
		expect(methodologyIdx).toBeLessThan(articlesIdx);
		expect(articlesIdx).toBeLessThan(statementsIdx);
		expect(txt).toContain(
			"- [Build log 01](https://ogsfrompoly.com/articles/build-log-01.md): How we set up the warehouse.",
		);
	});

	it("links to the methodology markdown endpoint for LLM consumers", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt).toContain("## Methodology");
		expect(txt).toContain(
			"- [Methodology](https://ogsfrompoly.com/methodology.md): How ogsfrompoly tests Polymarket wallets for repeatable skill",
		);
	});

	it("lists every entry as `- [title](.md URL): summary` under its collection", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt).toContain("## statements");
		expect(txt).toContain(
			"- [Placeholder weekly statement](https://ogsfrompoly.com/statements/2026-05-25-placeholder.md): Schema-exercise fixture.",
		);
	});
});
