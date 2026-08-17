/**
 * Value formatters shared by both for-dummies simulators (cluster copy and
 * wallet copy) — the fixed English instance of `locale-format.ts`, kept as
 * named functions so English-only consumers stay oblivious to locales.
 * Hand-rolled (no `Intl`) so the output is byte-identical in Node, the
 * Workers runtime, and the browser — the SSR paint and the client recompute
 * must never disagree about a string.
 */

import { formattersFor } from "./locale-format";
import { SIM_UNITS_EN } from "./sim-units-en";

const EN = formattersFor("en", SIM_UNITS_EN);

/** `1234.5` → `"$1,234.50"`, `1000` → `"$1,000"`. */
export function formatUsd(value: number): string {
	return EN.usd(value);
}

/**
 * An outcome price, which needs finer resolution than money: markets quote on
 * steps as small as `0.001`, so `formatUsd` would round two different limits
 * onto the same string. Trailing zeros are trimmed back to two decimals, so a
 * `0.01`-step market reads `$0.12` and a `0.001`-step one reads `$0.363`.
 */
export function formatPrice(value: number): string {
	return EN.price(value);
}

/** `13.774` → `"13.8 shares"`, `5` → `"5 shares"`, `1.04` → `"1 share"`. */
export function formatShares(value: number): string {
	return EN.shares(value);
}

/** `3` → `"3%"`, `1.5` → `"1.5%"`. */
export function formatPct(value: number): string {
	return EN.pct(value);
}

/** `3600` → `"1h"`, `1320` → `"22m"`, `0` → `"off"`. */
export function formatDuration(seconds: number): string {
	return EN.duration(seconds);
}

/** `2` → `"2 steps"`, `1` → `"1 step"`, `0` → `"off"`. */
export function formatSteps(value: number): string {
	return EN.steps(value);
}

/**
 * A threshold the YAML carries as a fraction (`0.02`, `0.5`) but a reader wants
 * as a percentage (`"2%"`, `"50%"`). Kept as a distinct unit rather than storing
 * the percentage in a live-config const, so those modules keep mirroring their
 * YAML sources literally — a value there can be diffed against the file it came
 * from.
 */
export function formatFraction(value: number): string {
	return EN.fraction(value);
}
