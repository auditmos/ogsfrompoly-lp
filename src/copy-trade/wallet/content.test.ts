import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import { resolveSimUnits, resolveWalletPage, resolveWalletSim } from "@/i18n/catalog";
import { formattersFor } from "../locale-format";
import { formatWalletKnobValue, WALLET_KNOBS, WALLET_LIVE_CONFIG } from "./config";
import {
	walletContentFor,
	walletCopyClosingMarkdown,
	walletCopyDescription,
	walletCopyIntroMarkdown,
	walletCopyMarkdown,
	walletCopyStoryMarkdown,
	walletCopyTitle,
	walletMarkdownFor,
} from "./content";
import { walletSummarySentence } from "./simulator";

// The HTML page renders the three blocks with the simulator slotted between
// them; the `.md` twin has to carry the same prose plus a static knob table.
const BLOCKS = {
	intro: walletCopyIntroMarkdown,
	story: walletCopyStoryMarkdown,
	closing: walletCopyClosingMarkdown,
};

describe("wallet-copy page disclosure", () => {
	it.each(Object.entries(BLOCKS))("keeps raw wallet hex out of the %s block", (_name, block) => {
		expect(findRawWalletHex(block)).toEqual([]);
	});

	it("keeps raw wallet hex out of the markdown twin", () => {
		expect(findRawWalletHex(walletCopyMarkdown)).toEqual([]);
	});

	it("names the leaders only by their anonymous config labels", () => {
		// The two mirrored wallets exist on the page solely as leader-a/leader-b.
		expect(walletCopyMarkdown).toContain("leader-a");
		expect(walletCopyMarkdown).toContain("leader-b");
		expect(findRawWalletHex(walletCopyMarkdown)).toEqual([]);
	});

	it("names the payout keys without ever carrying a payout address", () => {
		expect(walletCopyMarkdown).toContain("`profit_destination`");
		expect(walletCopyMarkdown).toContain("`destination_allowlist`");
		expect(findRawWalletHex(walletCopyMarkdown)).toEqual([]);
	});

	it("carries no scaffolding or operator-facing markers", () => {
		expect(findScaffoldingPhrases(walletCopyMarkdown)).toEqual([]);
	});

	it("links to nothing on the private upstream repo", () => {
		expect(walletCopyMarkdown).not.toContain("github.com/auditmos/ogsfrompoly");
	});
});

describe("walletCopyMarkdown", () => {
	it("opens with the page title and description so the .md stands alone", () => {
		expect(walletCopyMarkdown.startsWith(`# ${walletCopyTitle}\n`)).toBe(true);
		expect(walletCopyMarkdown).toContain(walletCopyDescription);
	});

	it("contains every prose block the HTML page renders", () => {
		for (const block of Object.values(BLOCKS)) {
			expect(walletCopyMarkdown).toContain(block);
		}
	});

	it("tables every shipped knob with its YAML key and live value", () => {
		for (const knob of WALLET_KNOBS) {
			expect(walletCopyMarkdown).toContain(
				`| ${knob.label} | \`${knob.yamlKey}\` | ${formatWalletKnobValue(knob.unit, WALLET_LIVE_CONFIG[knob.key])} |`,
			);
		}
	});

	it("substitutes a static one-sentence summary for the interactive panels", () => {
		expect(walletCopyMarkdown).toContain("## In one sentence");
		expect(walletCopyMarkdown).toContain("$500");
		expect(walletCopyMarkdown).toContain("$100 (leader-b)");
	});

	it("cross-links its sibling and the chooser rather than standing alone", () => {
		expect(walletCopyMarkdown).toContain("/for-dummies/copy-cluster");
		expect(walletCopyMarkdown).toContain("(/for-dummies)");
	});

	it("states the limits of its own numbers rather than only the mechanism", () => {
		// The honesty section has to survive, and it has to carry the limits that
		// are *currently* true: a days-old live history, and the rails the cluster
		// bot has that this one deliberately lacks.
		expect(walletCopyMarkdown).toContain("## What we are not claiming yet");
		expect(walletCopyMarkdown).toContain("no fee rail");
		expect(walletCopyMarkdown).toContain("days old");
		expect(walletCopyMarkdown).toContain("nothing to weigh");
	});

	it("describes the feature as live, not as the config header's stale draft state", () => {
		// The upstream YAML still carries a "NOT LIVE" comment written before
		// go-live; the page must reflect reality instead of quoting it.
		expect(walletCopyMarkdown).toContain("went live on **2026-08-11**");
		expect(walletCopyMarkdown).not.toContain("NOT LIVE");
		expect(walletCopyMarkdown).not.toMatch(/not yet live/i);
	});

	it("never names a market the bot has really traded", () => {
		// The first live position's market is public knowledge nowhere but the
		// operator's own channels; naming it would leak an open position.
		expect(walletCopyMarkdown).not.toMatch(/anthropic/i);
	});
});

/**
 * Issue #74 assumptions: every locale's HTML page and `.md` twin stitch from
 * the same catalog-resolved strings (the shared dual-format invariant); the
 * English stitch is byte-identical to the legacy exports; the cluster and hub
 * links are same-locale (their localized pages exist); leader labels stay
 * `leader-a` / `leader-b` in every locale and no raw wallet hex ever appears.
 */
describe("walletContentFor", () => {
	it("stitches the English twin identical to the legacy export", () => {
		expect(walletMarkdownFor("en")).toBe(walletCopyMarkdown);
		const english = walletContentFor("en");
		expect(english.introMarkdown).toBe(walletCopyIntroMarkdown);
		expect(english.storyMarkdown).toBe(walletCopyStoryMarkdown);
		expect(english.closingMarkdown).toBe(walletCopyClosingMarkdown);
	});

	it.each([["pl"], ["es"]] as const)("resolves the %s page translated in meaning", (locale) => {
		const localized = walletContentFor(locale);
		const english = walletContentFor("en");

		expect(localized.title).not.toBe(english.title);
		expect(localized.introMarkdown).not.toBe(english.introMarkdown);
		expect(localized.storyMarkdown).not.toBe(english.storyMarkdown);
		expect(localized.closingMarkdown).not.toBe(english.closingMarkdown);
	});

	it.each([
		["pl"],
		["es"],
	] as const)("links the %s page to the same-locale cluster, hub and methodology pages", (locale) => {
		const localized = walletContentFor(locale);

		expect(localized.introMarkdown).toContain(`(/${locale}/for-dummies/copy-cluster)`);
		expect(localized.introMarkdown).toContain(`(/${locale}/for-dummies)`);
		expect(localized.storyMarkdown).toContain(`(/${locale}/for-dummies/copy-cluster)`);
		expect(localized.closingMarkdown).toContain(`(/${locale}/methodology)`);
	});

	it.each([
		["en"],
		["pl"],
		["es"],
	] as const)("stitches every shared %s string into the .md twin", (locale) => {
		const content = walletContentFor(locale);
		const md = walletMarkdownFor(locale);
		const page = resolveWalletPage(locale);
		const sim = {
			locale,
			units: resolveSimUnits(locale),
			strings: resolveWalletSim(locale),
		};
		const fmt = formattersFor(locale, sim.units);

		expect(md).toContain(content.introMarkdown);
		expect(md).toContain(content.storyMarkdown);
		expect(md).toContain(content.closingMarkdown);
		expect(md).toContain(walletSummarySentence(WALLET_LIVE_CONFIG, sim));
		for (const knob of WALLET_KNOBS) {
			const label = page.knobs[knob.key];
			expect(label).toBeDefined();
			expect(md).toContain(
				`| ${label} | \`${knob.yamlKey}\` | ${formatWalletKnobValue(knob.unit, WALLET_LIVE_CONFIG[knob.key], fmt)} |`,
			);
		}
	});

	it.each([["pl"], ["es"]] as const)("keeps the %s twin inside the disclosure line", (locale) => {
		const md = walletMarkdownFor(locale);

		expect(findRawWalletHex(md)).toEqual([]);
		expect(findScaffoldingPhrases(md)).toEqual([]);
		expect(md).not.toContain("github.com/auditmos/ogsfrompoly");
		expect(md).toContain("leader-a");
		expect(md).toContain("leader-b");
	});
});
