import { findFullWalletAddresses } from "./body-disclosure";

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
