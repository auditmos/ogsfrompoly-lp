const EVM_ADDRESS = /0x[0-9a-f]{40}/gi;

export function findFullWalletAddresses(body: string): string[] {
	return body.match(EVM_ADDRESS) ?? [];
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
