import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import { resolveClusterPage, resolveClusterSim, resolveSimUnits } from "@/i18n/catalog";
import { formattersFor } from "../locale-format";
import { formatKnobValue, KNOBS, LIVE_CONFIG, SCENARIOS } from "./config";
import {
	clusterContentFor,
	clusterMarkdownFor,
	copyTradeClosingMarkdown,
	copyTradeDescription,
	copyTradeIntroMarkdown,
	copyTradeMarkdown,
	copyTradeStoryMarkdown,
	copyTradeTitle,
} from "./content";
import { summarySentence } from "./simulator";

// The HTML page renders the three blocks with the simulator slotted between
// them; the `.md` twin has to carry the same prose plus a static knob table.
const BLOCKS = {
	intro: copyTradeIntroMarkdown,
	story: copyTradeStoryMarkdown,
	closing: copyTradeClosingMarkdown,
};

describe("copy-trade page disclosure", () => {
	it.each(Object.entries(BLOCKS))("keeps raw wallet hex out of the %s block", (_name, block) => {
		expect(findRawWalletHex(block)).toEqual([]);
	});

	it("keeps raw wallet hex out of the markdown twin", () => {
		expect(findRawWalletHex(copyTradeMarkdown)).toEqual([]);
	});

	it("names the payout keys without ever carrying a payout address", () => {
		expect(copyTradeMarkdown).toContain("`profit_destination`");
		expect(copyTradeMarkdown).toContain("`destination_allowlist`");
		expect(findRawWalletHex(copyTradeMarkdown)).toEqual([]);
	});

	it("carries no scaffolding or operator-facing markers", () => {
		expect(findScaffoldingPhrases(copyTradeMarkdown)).toEqual([]);
	});

	it("links to nothing on the private upstream repo", () => {
		expect(copyTradeMarkdown).not.toContain("github.com/auditmos/ogsfrompoly");
	});
});

describe("copyTradeMarkdown", () => {
	it("opens with the page title and description so the .md stands alone", () => {
		expect(copyTradeMarkdown.startsWith(`# ${copyTradeTitle}\n`)).toBe(true);
		expect(copyTradeMarkdown).toContain(copyTradeDescription);
	});

	it("contains every prose block the HTML page renders", () => {
		for (const block of Object.values(BLOCKS)) {
			expect(copyTradeMarkdown).toContain(block);
		}
	});

	it("tables every shipped knob with its key and live value", () => {
		for (const knob of KNOBS) {
			expect(copyTradeMarkdown).toContain(
				`| ${knob.label} | \`${knob.key}\` | ${formatKnobValue(knob.unit, LIVE_CONFIG[knob.key])} |`,
			);
		}
	});

	it("substitutes a static one-sentence summary for the interactive panel", () => {
		expect(copyTradeMarkdown).toContain("## In one sentence");
		expect(copyTradeMarkdown).toContain("3+ skilled wallets");
	});

	it("states the limits of its own numbers rather than only the mechanism", () => {
		// The section has to survive, and it has to carry the limits that are
		// *currently* true. It used to say the ledger's missing fee meant no
		// performance figure was published; that fee is now recorded per fill, so
		// repeating it would be a stale disclaimer — which reads as candour while
		// misdescribing the thing. What is unproven now is the rails' youth.
		expect(copyTradeMarkdown).toContain("## What we are not claiming yet");
		expect(copyTradeMarkdown).toContain("mostly unexercised");
		expect(copyTradeMarkdown).toContain("Money recovered does not justify the price ceiling");
	});

	it("does not still claim the exchange fee is unrecorded", () => {
		// A guard against the specific regression this page just had: the fee was
		// described as "being wired in" for a week after it had been wired in.
		expect(copyTradeMarkdown).not.toContain("is being wired in");
		expect(copyTradeMarkdown).not.toContain("no performance figure");
	});
});

describe("example signals", () => {
	it("labels them as illustrative rather than as published alerts", () => {
		// The scenario markets are invented for the walkthrough. Guard against one
		// ever being copied from a real statement's market list.
		for (const scenario of SCENARIOS) {
			expect(findRawWalletHex(scenario.market)).toEqual([]);
			expect(scenario.market).not.toMatch(/wallet_/);
		}
	});

	it("gives every signal a unique id for the panel's button state", () => {
		expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
	});
});

/**
 * Issue #73 assumptions: every locale's HTML page and `.md` twin stitch from
 * the same catalog-resolved strings (the dual-format invariant shared with
 * methodology and the hub); the English stitch is byte-identical to the
 * legacy exports; link targets and config values are filled by the stitcher,
 * never carried inside translations. Cross-page links are same-locale now
 * that issue #74 shipped the localized wallet walkthrough.
 */
describe("clusterContentFor", () => {
	it("stitches the English twin identical to the legacy export", () => {
		expect(clusterMarkdownFor("en")).toBe(copyTradeMarkdown);
		const english = clusterContentFor("en");
		expect(english.introMarkdown).toBe(copyTradeIntroMarkdown);
		expect(english.storyMarkdown).toBe(copyTradeStoryMarkdown);
		expect(english.closingMarkdown).toBe(copyTradeClosingMarkdown);
	});

	it.each([["pl"], ["es"]] as const)("resolves the %s page translated in meaning", (locale) => {
		const localized = clusterContentFor(locale);
		const english = clusterContentFor("en");

		expect(localized.title).not.toBe(english.title);
		expect(localized.introMarkdown).not.toBe(english.introMarkdown);
		expect(localized.storyMarkdown).not.toBe(english.storyMarkdown);
		expect(localized.closingMarkdown).not.toBe(english.closingMarkdown);
	});

	it.each([
		["pl"],
		["es"],
	] as const)("links the %s page to the same-locale hub, methodology and wallet pages", (locale) => {
		const localized = clusterContentFor(locale);

		expect(localized.introMarkdown).toContain(`(/${locale}/for-dummies)`);
		expect(localized.closingMarkdown).toContain(`(/${locale}/methodology)`);
		expect(localized.introMarkdown).toContain(`(/${locale}/for-dummies/copy-wallet)`);
	});

	it.each([
		["en"],
		["pl"],
		["es"],
	] as const)("stitches every shared %s string into the .md twin", (locale) => {
		const content = clusterContentFor(locale);
		const md = clusterMarkdownFor(locale);
		const page = resolveClusterPage(locale);
		const sim = {
			locale,
			units: resolveSimUnits(locale),
			strings: resolveClusterSim(locale),
		};
		const fmt = formattersFor(locale, sim.units);

		expect(md).toContain(content.introMarkdown);
		expect(md).toContain(content.storyMarkdown);
		expect(md).toContain(content.closingMarkdown);
		expect(md).toContain(summarySentence(LIVE_CONFIG, sim));
		for (const knob of KNOBS) {
			const label = page.knobs[knob.key];
			expect(label).toBeDefined();
			expect(md).toContain(
				`| ${label} | \`${knob.key}\` | ${formatKnobValue(knob.unit, LIVE_CONFIG[knob.key], fmt)} |`,
			);
		}
	});

	it.each([["pl"], ["es"]] as const)("keeps the %s twin inside the disclosure line", (locale) => {
		const md = clusterMarkdownFor(locale);

		expect(findRawWalletHex(md)).toEqual([]);
		expect(findScaffoldingPhrases(md)).toEqual([]);
		expect(md).not.toContain("github.com/auditmos/ogsfrompoly");
	});
});
