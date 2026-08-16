import { proseEntries, type TranslationOverlay } from "./catalog";
import { buildHandoff, buildStatusReport } from "./extract";

const FIXTURE_EN = {
	hero: {
		heading: "We show our work.",
		intro: "Numbers, weekly.",
	},
	install: {
		eyebrow: "Install for your LLM agent",
	},
};

describe("buildHandoff", () => {
	it("is byte-identical across repeated invocations on unchanged input", () => {
		expect(buildHandoff(proseEntries(FIXTURE_EN))).toBe(buildHandoff(proseEntries(FIXTURE_EN)));
	});

	it("locks the en.json handoff artifact as a reviewable snapshot", () => {
		expect(buildHandoff(proseEntries(FIXTURE_EN))).toMatchInlineSnapshot(`
			"{
				"hero.heading": {
					"text": "We show our work.",
					"sourceHash": "fee8c245"
				},
				"hero.intro": {
					"text": "Numbers, weekly.",
					"sourceHash": "7308c238"
				},
				"install.eyebrow": {
					"text": "Install for your LLM agent",
					"sourceHash": "591ebb40"
				}
			}
			"
		`);
	});
});

function entryHash(key: string): string {
	const entry = proseEntries(FIXTURE_EN).find((e) => e.key === key);
	if (!entry) throw new Error(`fixture has no key ${key}`);
	return entry.sourceHash;
}

describe("buildStatusReport", () => {
	const plOverlay: TranslationOverlay = {
		"hero.heading": {
			translation: "Pokazujemy nasze wyliczenia.",
			sourceHash: entryHash("hero.heading"),
		},
		"install.eyebrow": {
			translation: "Przestarzałe tłumaczenie.",
			sourceHash: "00000000",
		},
	};

	it("classifies every key as translated, missing, or stale per locale", () => {
		const report = JSON.parse(
			buildStatusReport(proseEntries(FIXTURE_EN), { es: {}, pl: plOverlay }),
		);

		expect(report.pl).toEqual({
			"hero.heading": "translated",
			"hero.intro": "missing",
			"install.eyebrow": "stale",
		});
		expect(report.es).toEqual({
			"hero.heading": "missing",
			"hero.intro": "missing",
			"install.eyebrow": "missing",
		});
	});

	it("is byte-identical across repeated invocations on unchanged input", () => {
		expect(buildStatusReport(proseEntries(FIXTURE_EN), { es: {}, pl: plOverlay })).toBe(
			buildStatusReport(proseEntries(FIXTURE_EN), { pl: plOverlay, es: {} }),
		);
	});

	const allKeys = proseEntries(FIXTURE_EN).map((entry) => entry.key);

	it.each(allKeys)("editing the English source of %s flips exactly that key to stale", (edited) => {
		const fullyTranslated: TranslationOverlay = Object.fromEntries(
			proseEntries(FIXTURE_EN).map((entry) => [
				entry.key,
				{ translation: `PL: ${entry.text}`, sourceHash: entry.sourceHash },
			]),
		);
		const reworded = structuredClone(FIXTURE_EN);
		const path = edited.split(".");
		const leaf = path.pop();
		let node: Record<string, unknown> = reworded;
		for (const segment of path) {
			node = node[segment] as Record<string, unknown>;
		}
		if (!leaf) throw new Error(`fixture key ${edited} has no leaf segment`);
		node[leaf] = `${node[leaf]} (reworded)`;

		const report = JSON.parse(buildStatusReport(proseEntries(reworded), { pl: fullyTranslated }));

		expect(report.pl[edited]).toBe("stale");
		for (const key of allKeys.filter((k) => k !== edited)) {
			expect(report.pl[key]).toBe("translated");
		}
	});

	it("locks the status report artifact as a reviewable snapshot", () => {
		expect(
			buildStatusReport(proseEntries(FIXTURE_EN), { es: {}, pl: plOverlay }),
		).toMatchInlineSnapshot(`
			"{
				"es": {
					"hero.heading": "missing",
					"hero.intro": "missing",
					"install.eyebrow": "missing"
				},
				"pl": {
					"hero.heading": "translated",
					"hero.intro": "missing",
					"install.eyebrow": "stale"
				}
			}
			"
		`);
	});
});
