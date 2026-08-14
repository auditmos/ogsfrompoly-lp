import { findRawWalletHex, findScaffoldingPhrases } from "@/content/body-disclosure";
import { formatWalletKnobValue, WALLET_KNOBS, WALLET_LIVE_CONFIG } from "./config";
import {
	walletCopyClosingMarkdown,
	walletCopyDescription,
	walletCopyIntroMarkdown,
	walletCopyMarkdown,
	walletCopyStoryMarkdown,
	walletCopyTitle,
} from "./content";

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
