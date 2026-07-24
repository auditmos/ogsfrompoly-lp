const EVM_ADDRESS = /0x[0-9a-f]{40}/gi;

export function findFullWalletAddresses(body: string): string[] {
	return body.match(EVM_ADDRESS) ?? [];
}

/**
 * Any raw EVM-address hex token — a full 40-hex address OR a truncated fragment
 * like `0x1214a9A2…`. The site's ONLY sanctioned wallet reference is the
 * `wallet_XXXX` truncated ID; a raw `0x…` hex run never legitimately appears in
 * a statement, so its presence is the fingerprint of an address leak (the
 * copytrading execution/collection wallets especially — watching the execution
 * wallet leaks copytraded positions in real time).
 *
 * Deliberately broader than {@link findFullWalletAddresses}, which requires the
 * full 40 hex and so would miss a partially-truncated address. We match the
 * *shape*, never a specific address: this repo is PUBLIC, so committing a
 * sensitive address (even to a denylist) would itself be the leak we prevent.
 */
const RAW_ADDRESS_HEX = /0x[0-9a-f]{4,}/gi;

export function findRawWalletHex(text: string): string[] {
	return text.match(RAW_ADDRESS_HEX) ?? [];
}

/**
 * Operator-facing generator instructions that must never reach published prose.
 * Matched case-insensitively — they are never legitimate in reader copy.
 */
const OPERATOR_INSTRUCTION_PHRASES = [
	"left blank for the operator",
	"flipping `draft: false`",
	"belongs here",
] as const;

/**
 * Developer/generator markers matched case-sensitively, so ordinary prose
 * (e.g. "we keep todo lists") does not false-positive on the lowercase word.
 */
const CASE_SENSITIVE_MARKERS = ["TODO", "Placeholder"] as const;

export function findScaffoldingPhrases(body: string): string[] {
	const haystack = body.toLowerCase();
	const found: string[] = [];
	for (const phrase of OPERATOR_INSTRUCTION_PHRASES) {
		if (haystack.includes(phrase.toLowerCase())) {
			found.push(phrase);
		}
	}
	for (const marker of CASE_SENSITIVE_MARKERS) {
		if (body.includes(marker)) {
			found.push(marker);
		}
	}
	return found;
}
