import { buildPageMeta } from "./meta";

const SITE = "https://ogsfrompoly.com";

describe("buildPageMeta", () => {
	it("resolves a path to an absolute canonical URL on the configured site", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/statements",
			title: "Statements",
			description: "Every published statement.",
		});

		expect(meta.canonical).toBe("https://ogsfrompoly.com/statements");
	});

	it("strips a trailing slash from a non-root path", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/statements/2026-05-31-weekly/",
			title: "Weekly",
			description: "A weekly statement.",
		});

		expect(meta.canonical).toBe("https://ogsfrompoly.com/statements/2026-05-31-weekly");
	});

	it("keeps the root path as a single trailing slash", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/",
			title: "Home",
			description: "Landing page.",
		});

		expect(meta.canonical).toBe("https://ogsfrompoly.com/");
	});

	it("normalizes a site origin that carries a trailing slash (as Astro.site does)", () => {
		const fromString = buildPageMeta({
			site: "https://ogsfrompoly.com/",
			path: "/methodology",
			title: "Methodology",
			description: "How we measure skill.",
		});
		const fromUrl = buildPageMeta({
			site: new URL("https://ogsfrompoly.com/"),
			path: "/methodology",
			title: "Methodology",
			description: "How we measure skill.",
		});

		expect(fromString.canonical).toBe("https://ogsfrompoly.com/methodology");
		expect(fromUrl.canonical).toBe("https://ogsfrompoly.com/methodology");
	});

	it("builds Open Graph tags whose og:url matches the canonical", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/statements",
			title: "Statements · ogsfrompoly",
			description: "Every published statement.",
			type: "website",
		});

		expect(meta.og).toEqual({
			"og:title": "Statements · ogsfrompoly",
			"og:description": "Every published statement.",
			"og:type": "website",
			"og:url": "https://ogsfrompoly.com/statements",
		});
		expect(meta.og["og:url"]).toBe(meta.canonical);
	});

	it("builds a Twitter summary card", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/statements",
			title: "Statements · ogsfrompoly",
			description: "Every published statement.",
		});

		expect(meta.twitter).toEqual({
			"twitter:card": "summary",
			"twitter:title": "Statements · ogsfrompoly",
			"twitter:description": "Every published statement.",
		});
	});

	it("defaults og:type to website when no type is given", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/",
			title: "Home",
			description: "Landing page.",
		});

		expect(meta.og["og:type"]).toBe("website");
	});

	it("marks statement pages as og:type article", () => {
		const meta = buildPageMeta({
			site: SITE,
			path: "/statements/2026-05-31-weekly",
			title: "Weekly · ogsfrompoly",
			description: "A weekly statement.",
			type: "article",
		});

		expect(meta.og["og:type"]).toBe("article");
	});
});
