import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import { formatKnobValue, KNOBS, LIVE_CONFIG, SCENARIOS } from "./config";
import {
	copyTradeClosingMarkdown,
	copyTradeDescription,
	copyTradeIntroMarkdown,
	copyTradeMarkdown,
	copyTradeStoryMarkdown,
	copyTradeTitle,
} from "./content";

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
