import {
	findFullWalletAddresses,
	findRawWalletHex,
	findScaffoldingPhrases,
} from "./body-disclosure";

describe("findFullWalletAddresses", () => {
	it("returns an empty array when the body contains no addresses", () => {
		expect(findFullWalletAddresses("Plain prose with no addresses.")).toEqual([]);
	});

	it("accepts truncated wallet IDs", () => {
		const body = "Top performer: `wallet_a3f8` outperformed the cohort.";
		expect(findFullWalletAddresses(body)).toEqual([]);
	});

	it.each([
		["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "lowercase hex"],
		["0X742D35CC6634C0532925A3B844BC9E7595F0BEB0", "uppercase 0X prefix"],
		["0xAAAAaaaaBBBBbbbbCCCCccccDDDDddddEEEEeeee", "mixed case"],
	])("flags a full EVM address: %s (%s)", (address) => {
		const body = `Inspect ${address} on chain.`;
		expect(findFullWalletAddresses(body)).toEqual([address]);
	});

	it("flags multiple addresses in the same body", () => {
		const body =
			"First 0x1111111111111111111111111111111111111111 and then 0x2222222222222222222222222222222222222222 next.";
		expect(findFullWalletAddresses(body)).toHaveLength(2);
	});

	it("does not flag 39-char strings that fall short of the EVM length", () => {
		const body = "Almost-address 0x111111111111111111111111111111111111111 — too short.";
		expect(findFullWalletAddresses(body)).toEqual([]);
	});
});

describe("findRawWalletHex", () => {
	it("returns an empty array for prose with no 0x hex", () => {
		expect(findRawWalletHex("Top performer: `wallet_a3f8` swept $120 to the ledger.")).toEqual([]);
	});

	it("does not flag truncated wallet IDs (the sanctioned form)", () => {
		expect(findRawWalletHex("Pool wallet `wallet_1214`; gains to `wallet_c3fb`.")).toEqual([]);
	});

	it("flags a full EVM address", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
		expect(findRawWalletHex(`Inspect ${addr}.`)).toEqual([addr]);
	});

	it.each([
		["0x1214a9A2", "8-hex leading fragment"],
		["0xC3fb801B", "collection-style leading fragment"],
		["0x1214", "4-hex minimal truncation"],
	])("flags a truncated address fragment: %s (%s)", (fragment) => {
		expect(findRawWalletHex(`Sent to ${fragment}… on chain.`)).toContain(fragment);
	});

	it("catches a fragment even when the full address regex would miss it", () => {
		// 12 hex — a real partial leak that `findFullWalletAddresses` (needs 40) ignores.
		const body = "Execution wallet 0x1214a9A229ed… runs the copytrades.";
		expect(findFullWalletAddresses(body)).toEqual([]);
		expect(findRawWalletHex(body)).toHaveLength(1);
	});

	it("does not flag a bare 0x with fewer than 4 hex", () => {
		expect(findRawWalletHex("The 0x prefix, or 0xFF as a byte, is not an address.")).toEqual([]);
	});
});

describe("findScaffoldingPhrases", () => {
	it("flags the 'left blank for the operator' generator instruction", () => {
		const body =
			"Numbers are mechanically derived; commentary below is left blank for the operator to fill.";
		expect(findScaffoldingPhrases(body)).toContain("left blank for the operator");
	});

	it("flags the 'flipping `draft: false`' generator instruction", () => {
		const body = "...to fill before flipping `draft: false`.";
		expect(findScaffoldingPhrases(body)).toContain("flipping `draft: false`");
	});

	it("flags the 'belongs here' P&L prose stub", () => {
		const body = "See the `pnl` block above; the prose breakdown belongs here.";
		expect(findScaffoldingPhrases(body)).toContain("belongs here");
	});

	it("flags the all-caps TODO developer marker", () => {
		const body = "TODO: write the real commentary before publishing.";
		expect(findScaffoldingPhrases(body)).toContain("TODO");
	});

	it("does not flag lowercase 'todo' in legitimate prose", () => {
		const body = "The desk keeps todo lists for open positions internally.";
		expect(findScaffoldingPhrases(body)).toEqual([]);
	});

	it("flags the capitalized Placeholder developer marker", () => {
		const body = "Placeholder statement — exercises the schema only.";
		expect(findScaffoldingPhrases(body)).toContain("Placeholder");
	});

	it("does not flag lowercase 'placeholder' in legitimate prose", () => {
		const body = "None of these numbers are a placeholder; they are real ledger entries.";
		expect(findScaffoldingPhrases(body)).toEqual([]);
	});

	it("returns an empty array for clean published prose", () => {
		const body =
			"Numbers in the frontmatter are mechanically derived. Top wallets are ranked by realized PnL magnitude.";
		expect(findScaffoldingPhrases(body)).toEqual([]);
	});

	it("returns every distinct phrase present in a body", () => {
		const body =
			"commentary below is left blank for the operator to fill before flipping `draft: false`.";
		expect(findScaffoldingPhrases(body)).toEqual(
			expect.arrayContaining(["left blank for the operator", "flipping `draft: false`"]),
		);
		expect(findScaffoldingPhrases(body)).toHaveLength(2);
	});

	it("reports a repeated phrase only once", () => {
		const body = "TODO first thing. TODO second thing.";
		expect(findScaffoldingPhrases(body)).toEqual(["TODO"]);
	});
});
