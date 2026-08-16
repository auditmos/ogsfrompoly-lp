import { hashSource, resolveHomeProse, resolveProse, type TranslationOverlay } from "./catalog";
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

	it("keeps missing and stale pl keys on current English", () => {
		const resolved = resolveHomeProse("pl");

		expect(resolved.install.eyebrow).toBe(HOME_EN.install.eyebrow);
		expect(resolved.skin.eyebrow).toBe(HOME_EN.skin.eyebrow);
	});
});
