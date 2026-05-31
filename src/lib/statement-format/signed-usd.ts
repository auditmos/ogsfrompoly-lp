const MINUS = "−";

export function formatSignedUsd(value: number): string {
	const rounded = Math.round(value);
	if (rounded === 0) return "$0";
	const abs = Math.abs(rounded).toLocaleString("en-US");
	return rounded > 0 ? `+$${abs}` : `${MINUS}$${abs}`;
}
