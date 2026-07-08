import { findFullWalletAddresses, findScaffoldingPhrases } from "./body-disclosure";

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
