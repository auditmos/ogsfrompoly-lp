import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import {
	BOT_CARDS,
	COMPARE_ROWS,
	forDummiesDescription,
	forDummiesMarkdown,
	forDummiesMarkdownFor,
	forDummiesTitle,
	hubFor,
} from "./hub-content";

describe("for-dummies hub disclosure", () => {
	it("keeps raw wallet hex out of the markdown twin", () => {
		expect(findRawWalletHex(forDummiesMarkdown)).toEqual([]);
	});

	it("carries no scaffolding or operator-facing markers", () => {
		expect(findScaffoldingPhrases(forDummiesMarkdown)).toEqual([]);
	});

	it("links to nothing on the private upstream repo", () => {
		expect(forDummiesMarkdown).not.toContain("github.com/auditmos/ogsfrompoly");
	});
});

describe("hubFor", () => {
	it("stitches the English markdown identical to the legacy export", () => {
		expect(forDummiesMarkdownFor("en")).toBe(forDummiesMarkdown);
	});

	// The cluster walkthrough ships localized pages (issue #73), so its card
	// links same-locale; the wallet walkthrough doesn't yet, so its card keeps
	// the live English page (the per-link English fallback) instead of a dead
	// same-locale URL — issue #74 flips it. Methodology is same-locale already.
	it.each([
		["pl"],
		["es"],
	] as const)("links the %s cluster card same-locale, wallet card to English", (locale) => {
		const hub = hubFor(locale);

		expect(hub.cards.map((card) => card.href)).toEqual([
			`/${locale}/for-dummies/copy-cluster`,
			"/for-dummies/copy-wallet",
		]);
		for (const card of hub.cards) {
			expect(card.mdHref).toBe(`${card.href}.md`);
		}
		expect(hub.methodologyHref).toBe(`/${locale}/methodology`);
	});

	it.each([["pl"], ["es"]] as const)("resolves the %s hub translated in meaning", (locale) => {
		const hub = hubFor(locale);
		const english = hubFor("en");

		expect(hub.title).not.toBe(english.title);
		expect(hub.heading).not.toBe(english.heading);
		for (const [index, card] of hub.cards.entries()) {
			const englishCard = english.cards[index];
			expect(card.name).not.toBe(englishCard?.name);
			expect(card.tagline).not.toBe(englishCard?.tagline);
		}
	});

	// The dual-format invariant shared with methodology: the HTML page renders
	// the hubFor model and the .md twin renders forDummiesMarkdownFor — both
	// resolve from the same catalog strings, so every model string the two
	// surfaces share must appear verbatim in the stitched twin, in any locale.
	it.each([
		["en"],
		["pl"],
		["es"],
	] as const)("stitches every shared %s hub string into the .md twin", (locale) => {
		const hub = hubFor(locale);
		const md = forDummiesMarkdownFor(locale);

		expect(md).toContain(hub.title);
		expect(md).toContain(hub.description);
		expect(md).toContain(hub.sideBySide);
		expect(md).toContain(hub.sharedNote);
		for (const card of hub.cards) {
			expect(md).toContain(card.name);
			expect(md).toContain(card.tagline);
			for (const fact of card.facts) {
				expect(md).toContain(`- **${fact.label}**: ${fact.value}`);
			}
		}
		for (const row of hub.rows) {
			expect(md).toContain(`| ${row.label} | ${row.cluster} | ${row.wallet} |`);
		}
	});

	it("keeps the English hub model on English URLs and strings", () => {
		const hub = hubFor("en");

		expect(hub.cards.map((card) => card.href)).toEqual([
			"/for-dummies/copy-cluster",
			"/for-dummies/copy-wallet",
		]);
		expect(hub.methodologyHref).toBe("/methodology");
		expect(hub.title).toBe(forDummiesTitle);
	});
});

describe("BOT_CARDS", () => {
	it("routes one card to each walkthrough, HTML and markdown twin alike", () => {
		expect(BOT_CARDS.map((card) => card.href)).toEqual([
			"/for-dummies/copy-cluster",
			"/for-dummies/copy-wallet",
		]);
		for (const card of BOT_CARDS) {
			expect(card.mdHref).toBe(`${card.href}.md`);
		}
	});

	it("gives every card facts the hub can table", () => {
		for (const card of BOT_CARDS) {
			expect(card.facts.length).toBeGreaterThan(0);
			expect(card.tagline.length).toBeGreaterThan(0);
		}
	});
});

describe("forDummiesMarkdown", () => {
	it("opens with the hub title and description so the .md stands alone", () => {
		expect(forDummiesMarkdown.startsWith(`# ${forDummiesTitle}\n`)).toBe(true);
		expect(forDummiesMarkdown).toContain(forDummiesDescription);
	});

	it("links both walkthroughs and their markdown twins", () => {
		for (const card of BOT_CARDS) {
			expect(forDummiesMarkdown).toContain(`(${card.href})`);
			expect(forDummiesMarkdown).toContain(`(${card.mdHref})`);
		}
	});

	it("tables every comparison row on both sides", () => {
		expect(forDummiesMarkdown).toContain("## Side by side");
		for (const row of COMPARE_ROWS) {
			expect(forDummiesMarkdown).toContain(`| ${row.label} | ${row.cluster} | ${row.wallet} |`);
		}
	});

	it("points at the disclosure policy instead of restating it", () => {
		expect(forDummiesMarkdown).toContain("(/methodology)");
	});
});
