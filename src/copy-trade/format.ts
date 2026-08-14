/**
 * Value formatters shared by both for-dummies simulators (cluster copy and
 * wallet copy). Hand-rolled so the output is byte-identical in Node, the
 * Workers runtime, and the browser — the SSR paint and the client recompute
 * must never disagree about a string.
 */

function withThousands(integerPart: string): string {
	return integerPart.replace(/\B(?=(\d{3})+$)/g, ",");
}

/** `1234.5` → `"$1,234.50"`, `1000` → `"$1,000"`. */
export function formatUsd(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
	const [whole = "0", fraction] = text.replace("-", "").split(".");
	const sign = rounded < 0 ? "-" : "";
	const body =
		fraction === undefined ? withThousands(whole) : `${withThousands(whole)}.${fraction}`;
	return `${sign}$${body}`;
}

/**
 * An outcome price, which needs finer resolution than money: markets quote on
 * steps as small as `0.001`, so `formatUsd` would round two different limits
 * onto the same string. Trailing zeros are trimmed back to two decimals, so a
 * `0.01`-step market reads `$0.12` and a `0.001`-step one reads `$0.363`.
 */
export function formatPrice(value: number): string {
	const rounded = Math.round(value * 1000) / 1000;
	const text = rounded.toFixed(3).replace(/0$/, "");
	return `$${text}`;
}

/** `13.774` → `"13.8 shares"`, `5` → `"5 shares"`, `1.04` → `"1 share"`. */
export function formatShares(value: number): string {
	const rounded = Math.round(value * 10) / 10;
	const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
	return `${text} ${rounded === 1 ? "share" : "shares"}`;
}

/** `3` → `"3%"`, `1.5` → `"1.5%"`. */
export function formatPct(value: number): string {
	const rounded = Math.round(value * 10) / 10;
	return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** `3600` → `"1h"`, `1320` → `"22m"`, `0` → `"off"`. */
export function formatDuration(seconds: number): string {
	if (seconds <= 0) return "off";
	if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
	const hours = seconds / 3600;
	if (hours < 24) return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
	const days = hours / 24;
	return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
}

/** `2` → `"2 steps"`, `1` → `"1 step"`, `0` → `"off"`. */
export function formatSteps(value: number): string {
	if (value <= 0) return "off";
	return `${value} ${value === 1 ? "step" : "steps"}`;
}

/**
 * A threshold the YAML carries as a fraction (`0.02`, `0.5`) but a reader wants
 * as a percentage (`"2%"`, `"50%"`). Kept as a distinct unit rather than storing
 * the percentage in a live-config const, so those modules keep mirroring their
 * YAML sources literally — a value there can be diffed against the file it came
 * from.
 */
export function formatFraction(value: number): string {
	if (value <= 0) return "off";
	return formatPct(value * 100);
}
