import {
	catalogEntries,
	hashSource,
	localeOverlay,
	proseEntries,
	resolveHomeProse,
	resolveProse,
	TRANSLATED_LOCALES,
	type TranslationOverlay,
} from "./catalog";
import { HOME_EN } from "./home-en";

const FIXTURE_EN = {
	hero: {
		heading: "We show our work.",
		intro: "Numbers, weekly.",
	},
	install: {
		eyebrow: "Install for your LLM agent",
	},
};

describe("resolveProse", () => {
	it("renders the translation for a key whose sourceHash matches the English source", () => {
		const overlay: TranslationOverlay = {
			"hero.heading": {
				translation: "Pokazujemy nasze wyliczenia.",
				sourceHash: hashSource("We show our work."),
			},
		};

		const resolved = resolveProse(FIXTURE_EN, overlay);

		expect(resolved.hero.heading).toBe("Pokazujemy nasze wyliczenia.");
	});

	it("renders current English for a key missing from the overlay", () => {
		const overlay: TranslationOverlay = {
			"hero.heading": {
				translation: "Pokazujemy nasze wyliczenia.",
				sourceHash: hashSource("We show our work."),
			},
		};

		const resolved = resolveProse(FIXTURE_EN, overlay);

		expect(resolved.hero.intro).toBe("Numbers, weekly.");
		expect(resolved.install.eyebrow).toBe("Install for your LLM agent");
	});

	it("renders current English for a key whose sourceHash no longer matches", () => {
		const overlay: TranslationOverlay = {
			"hero.heading": {
				translation: "Przestarzałe tłumaczenie.",
				sourceHash: hashSource("An earlier English source, since rewritten."),
			},
		};

		const resolved = resolveProse(FIXTURE_EN, overlay);

		expect(resolved.hero.heading).toBe("We show our work.");
	});

	it("resolves to an object with the identical shape as the English original", () => {
		const overlay: TranslationOverlay = {
			"hero.heading": {
				translation: "Pokazujemy nasze wyliczenia.",
				sourceHash: hashSource("We show our work."),
			},
			"install.eyebrow": {
				translation: "Przestarzałe tłumaczenie.",
				sourceHash: "deadbeef",
			},
		};

		const resolved = resolveProse(FIXTURE_EN, overlay);

		expect(resolved).toEqual({
			hero: {
				heading: "Pokazujemy nasze wyliczenia.",
				intro: "Numbers, weekly.",
			},
			install: {
				eyebrow: "Install for your LLM agent",
			},
		});
	});
});

describe("resolveHomeProse", () => {
	it("returns the canonical English prose for locale en", () => {
		expect(resolveHomeProse("en")).toEqual(HOME_EN);
	});

	it("returns a live Polish translation for at least one key for locale pl", () => {
		const resolved = resolveHomeProse("pl");

		expect(resolved.hero.heading).not.toBe(HOME_EN.hero.heading);
	});

	it("returns a Spanish translation distinct from English and Polish for locale es", () => {
		const resolved = resolveHomeProse("es");

		expect(resolved.hero.heading).not.toBe(HOME_EN.hero.heading);
		expect(resolved.hero.heading).not.toBe(resolveHomeProse("pl").hero.heading);
	});

	it("resolves localized page meta for translated locales", () => {
		expect(resolveHomeProse("pl").meta.title).not.toBe(HOME_EN.meta.title);
		expect(resolveHomeProse("es").meta.description).not.toBe(HOME_EN.meta.description);
	});
});

describe("section-level fallback", () => {
	const sectionsEn = () => ({
		methodology: {
			sections: {
				intro: "English intro.",
				scope: "English scope.",
				disclosure: "English disclosure.",
			},
		},
	});
	const overlay: TranslationOverlay = {
		"methodology.sections.intro": {
			translation: "Polskie intro.",
			sourceHash: hashSource("English intro."),
		},
		"methodology.sections.scope": {
			translation: "Polski zakres.",
			sourceHash: hashSource("English scope."),
		},
		"methodology.sections.disclosure": {
			translation: "Polska polityka.",
			sourceHash: hashSource("English disclosure."),
		},
	};

	it.each([
		["intro"],
		["scope"],
		["disclosure"],
	] as const)("editing the English source of one section (%s) makes only that section fall back", (edited) => {
		const en = sectionsEn();
		en.methodology.sections[edited] = `${en.methodology.sections[edited]} Rewritten.`;

		const resolved = resolveProse(en, overlay).methodology.sections;

		for (const key of ["intro", "scope", "disclosure"] as const) {
			if (key === edited) {
				expect(resolved[key]).toBe(en.methodology.sections[key]);
			} else {
				expect(resolved[key]).toBe(overlay[`methodology.sections.${key}`]?.translation);
			}
		}
	});
});

describe("seed coverage", () => {
	it("delivers a fresh translation for every catalog key in every translated locale", () => {
		for (const locale of TRANSLATED_LOCALES) {
			const overlay = localeOverlay(locale);
			for (const entry of catalogEntries()) {
				const delivered = overlay[entry.key];
				expect(delivered, `${locale} is missing ${entry.key}`).toBeDefined();
				expect(delivered?.sourceHash, `${locale} ${entry.key} is stale`).toBe(entry.sourceHash);
			}
		}
	});
});

describe("catalogEntries", () => {
	it("walks every registered English key with its current source text", () => {
		const keys = catalogEntries().map((entry) => entry.key);

		for (const entry of proseEntries(HOME_EN)) {
			expect(keys).toContain(entry.key);
		}
		expect(keys).toContain("methodology.title");
		expect(keys).toContain("methodology.sections.disclosure");
		expect(catalogEntries().find((entry) => entry.key === "hero.heading")?.text).toBe(
			HOME_EN.hero.heading,
		);
	});
});

describe("localeOverlay", () => {
	it("returns a delivered overlay for every translated locale", () => {
		expect(Object.keys(localeOverlay("pl")).length).toBeGreaterThan(0);
		expect(Object.keys(localeOverlay("es")).length).toBeGreaterThan(0);
	});
});
