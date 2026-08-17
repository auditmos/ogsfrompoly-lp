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
		const entries = catalogEntries();

		expect(entries.map((entry) => entry.key)).toEqual(
			proseEntries(HOME_EN).map((entry) => entry.key),
		);
		expect(entries.find((entry) => entry.key === "hero.heading")?.text).toBe(HOME_EN.hero.heading);
	});
});

describe("localeOverlay", () => {
	it("returns a delivered overlay for every translated locale", () => {
		expect(Object.keys(localeOverlay("pl")).length).toBeGreaterThan(0);
		expect(Object.keys(localeOverlay("es")).length).toBeGreaterThan(0);
	});
});
