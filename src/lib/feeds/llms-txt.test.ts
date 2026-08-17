import {
	resolveClusterPage,
	resolveHubProse,
	resolveMethodologyProse,
	resolveWalletPage,
} from "@/i18n/catalog";
import { generateLlmsTxt } from "./llms-txt";
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
		const browseAllIdx = txt.indexOf("## Browse all");
		const methodologyIdx = txt.indexOf("## Methodology");
		const copyTradeIdx = txt.indexOf("## Copy trade");
		const statementsIdx = txt.indexOf("## statements");
		expect(articlesIdx).toBeGreaterThan(-1);
		expect(browseAllIdx).toBeGreaterThan(-1);
		expect(methodologyIdx).toBeGreaterThan(-1);
		expect(copyTradeIdx).toBeGreaterThan(-1);
		expect(statementsIdx).toBeGreaterThan(-1);
		// Static docs in declaration order → per-collection sections (alphabetical).
		expect(browseAllIdx).toBeLessThan(methodologyIdx);
		expect(methodologyIdx).toBeLessThan(copyTradeIdx);
		expect(copyTradeIdx).toBeLessThan(articlesIdx);
		expect(articlesIdx).toBeLessThan(statementsIdx);
		expect(txt).toContain(
			"- [Build log 01](https://ogsfrompoly.com/articles/build-log-01.md): How we set up the warehouse.",
		);
	});

	it("exposes the statements index as a top-level Browse-all entry for agent discovery", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt).toContain("## Browse all");
		expect(txt).toContain(
			"- [All statements](https://ogsfrompoly.com/statements.md): Index of every published statement — weekly track record and monthly project P&L, newest first.",
		);
	});

	it("links to the methodology markdown endpoint for LLM consumers", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt).toContain("## Methodology");
		expect(txt).toContain(
			"- [Methodology](https://ogsfrompoly.com/methodology.md): How ogsfrompoly separates skill from luck on Polymarket",
		);
	});

	it("links every copy-trade explainer markdown endpoint for LLM consumers", () => {
		const txt = generateLlmsTxt(baseInput);

		expect(txt).toContain("## Copy trade");
		expect(txt).toContain(
			"- [Copy trading for dummies](https://ogsfrompoly.com/for-dummies.md): Two small agents",
		);
		expect(txt).toContain(
			"- [Cluster copy for dummies](https://ogsfrompoly.com/for-dummies/copy-cluster.md): Plain-English walkthrough of the ogsfrompoly cluster-copy agent",
		);
		expect(txt).toContain(
			"- [Wallet copy for dummies](https://ogsfrompoly.com/for-dummies/copy-wallet.md): Plain-English walkthrough of the ogsfrompoly wallet-copy agent",
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

/**
 * Issue #75 assumptions: the discovery layer lists every translated `.md`
 * twin (methodology + hub + two walkthroughs × pl/es) under a per-language
 * section, with titles and summaries imported from the same catalog-resolved
 * content modules the pages render — asserted by equality against the
 * resolvers, so a restated string cannot drift. English sections stay
 * byte-identical; per-language sections sit between them and the
 * per-collection sections.
 */
describe("per-language sections", () => {
	it("lists every translated twin under its language section with imported titles", () => {
		const txt = generateLlmsTxt(baseInput);

		const polishIdx = txt.indexOf("## Polski");
		const spanishIdx = txt.indexOf("## Español");
		const statementsIdx = txt.indexOf("## statements");
		expect(polishIdx).toBeGreaterThan(txt.indexOf("## Copy trade"));
		expect(spanishIdx).toBeGreaterThan(polishIdx);
		expect(statementsIdx).toBeGreaterThan(spanishIdx);

		for (const locale of ["pl", "es"] as const) {
			const methodology = resolveMethodologyProse(locale);
			const hub = resolveHubProse(locale);
			const cluster = resolveClusterPage(locale);
			const wallet = resolveWalletPage(locale);

			expect(txt).toContain(
				`- [${methodology.title}](https://ogsfrompoly.com/${locale}/methodology.md): ${methodology.description}`,
			);
			expect(txt).toContain(
				`- [${hub.title}](https://ogsfrompoly.com/${locale}/for-dummies.md): ${hub.description}`,
			);
			expect(txt).toContain(
				`- [${cluster.title}](https://ogsfrompoly.com/${locale}/for-dummies/copy-cluster.md): ${cluster.description}`,
			);
			expect(txt).toContain(
				`- [${wallet.title}](https://ogsfrompoly.com/${locale}/for-dummies/copy-wallet.md): ${wallet.description}`,
			);
		}
	});
});
