import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import {
	BOT_CARDS,
	COMPARE_ROWS,
	forDummiesDescription,
	forDummiesMarkdown,
	forDummiesTitle,
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
