import {
	breaches,
	buildScoreDocument,
	FINDING_WEIGHT_THRESHOLD,
	formatReport,
	type LocaleReport,
	parseLocaleReport,
	SCORE_THRESHOLD,
	stripEmDashRule,
} from "./i18n-slop-lib";

const STATS = { wordCount: 100, burstiness: 0.8, typeTokenRatio: 0.6, trigramRepetition: 0.1 };

function sloplintJson(findings: object[]): string {
	return JSON.stringify({ score: 10, stats: STATS, findings });
}

function report(overrides: Partial<LocaleReport>): LocaleReport {
	return { locale: "en", score: 10, stats: STATS, findings: [], ...overrides };
}

describe("buildScoreDocument", () => {
	it("places item i on line 2i+1 with a blank separator", () => {
		const { text, keyForLine } = buildScoreDocument([
			{ key: "a.one", text: "First." },
			{ key: "a.two", text: "Second." },
		]);
		expect(text.split("\n")).toEqual(["First.", "", "Second.", ""]);
		expect(keyForLine[0]).toBe("a.one");
		expect(keyForLine[2]).toBe("a.two");
	});

	it("flattens embedded newlines so line numbers stay aligned", () => {
		const { text } = buildScoreDocument([{ key: "k", text: "Line one\nline two" }]);
		expect(text.split("\n")[0]).toBe("Line one line two");
	});
});

describe("stripEmDashRule", () => {
	it("removes only the em-dash regex rule and keeps everything else", () => {
		const pack = JSON.stringify({
			vocabulary: { tier1: { weight: 5, words: ["synergy"] } },
			regex: [
				{ id: "em-dash", pattern: "x", category: "style", weight: 2 },
				{ id: "emoji", pattern: "y", category: "style", weight: 2 },
			],
		});
		const stripped = JSON.parse(stripEmDashRule(pack));
		expect(stripped.regex.map((r: { id: string }) => r.id)).toEqual(["emoji"]);
		expect(stripped.vocabulary.tier1.words).toEqual(["synergy"]);
	});

	it("passes through a pack with no regex rules", () => {
		expect(JSON.parse(stripEmDashRule(JSON.stringify({ phrases: [] })))).toEqual({
			phrases: [],
		});
	});
});

describe("parseLocaleReport", () => {
	it("maps finding lines back to their keys", () => {
		const json = sloplintJson([
			{ id: "vocab:synergy", category: "vocabulary", weight: 5, match: "synergy", line: 3 },
		]);
		const result = parseLocaleReport("en", json, ["a.one", "", "a.two", ""]);
		expect(result.findings).toHaveLength(1);
		expect(result.findings[0]?.key).toBe("a.two");
	});

	it.each([
		["✓"],
		["✗"],
	])("exempts the %s simulator legend symbol from the emoji rule", (symbol) => {
		const json = sloplintJson([
			{ id: "emoji", category: "style", weight: 3, match: symbol, line: 1 },
		]);
		expect(parseLocaleReport("pl", json, ["k", ""]).findings).toHaveLength(0);
	});

	it("keeps a genuine emoji finding", () => {
		const json = sloplintJson([
			{ id: "emoji", category: "style", weight: 3, match: "🚀", line: 1 },
		]);
		expect(parseLocaleReport("pl", json, ["k", ""]).findings).toHaveLength(1);
	});

	it("rejects malformed sloplint output", () => {
		expect(() => parseLocaleReport("en", '{"score":"high"}', [])).toThrow();
	});
});

describe("breaches", () => {
	it("returns nothing for a clean report", () => {
		expect(breaches([report({})])).toEqual([]);
	});

	it("fails a locale at or above the score threshold", () => {
		const failures = breaches([report({ locale: "pl", score: SCORE_THRESHOLD })]);
		expect(failures).toHaveLength(1);
		expect(failures[0]).toContain("pl");
	});

	it("fails on a single high-weight finding even under the score threshold", () => {
		const failures = breaches([
			report({
				findings: [
					{
						key: "hero.intro",
						id: "es-no-es-solo",
						category: "calque",
						weight: FINDING_WEIGHT_THRESHOLD,
						match: "No es solo",
						line: 1,
					},
				],
			}),
		]);
		expect(failures).toHaveLength(1);
		expect(failures[0]).toContain("hero.intro");
	});

	it("lists low-weight findings without failing", () => {
		const failures = breaches([
			report({
				findings: [
					{
						key: "k",
						id: "vocab:clave",
						category: "vocabulary",
						weight: 1,
						match: "clave",
						line: 1,
					},
				],
			}),
		]);
		expect(failures).toEqual([]);
	});
});

describe("formatReport", () => {
	it("prints one row per locale and one line per finding", () => {
		const text = formatReport([
			report({ locale: "es", score: 14 }),
			report({
				locale: "pl",
				findings: [
					{
						key: "hub.title",
						category: "filler",
						weight: 3,
						match: "warto podkreślić",
						line: 1,
						fix: "wytnij",
					},
				],
			}),
		]);
		expect(text).toContain("es      14");
		expect(text).toContain("hub.title");
		expect(text).toContain("wytnij");
	});
});
