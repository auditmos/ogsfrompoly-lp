/**
 * The copy-trade executor's tunable surface, mirrored from `config/copy_trade.yml`.
 *
 * This module is the single source of truth for the "for dummies" page: the same
 * const feeds the SSR-rendered sliders, the client-side recompute, and the
 * markdown table on the `.md` twin. A knob added here shows up on all three
 * surfaces with no per-surface work.
 *
 * Disclosure note: only *thresholds* live here. `profit_destination` and
 * `destination_allowlist` are named in the prose as keys and never carry a
 * value — publishing either address would leak the copytrading wallets.
 */

/** The market whose live config the defaults reflect. */
export const CONFIG_MARKET = "Macro";
/** When those defaults were last read off the running executor. */
export const CONFIG_AS_OF = "2026-07-27";

export type KnobKey =
	| "cluster_threshold"
	| "min_liquidity_usdc"
	| "min_seconds_to_resolution"
	| "staleness_pct"
	| "trade_size_usdc"
	| "exposure_cap_usdc"
	| "working_capital_floor_usdc"
	| "gas_reserve_pol"
	| "slippage_pct";

export type KnobValues = Record<KnobKey, number>;

/**
 * The values running in production today. Typed as a total `Record`, so adding a
 * `KnobKey` without a live value is a compile error rather than a silent gap.
 */
export const LIVE_CONFIG: KnobValues = {
	cluster_threshold: 3,
	min_liquidity_usdc: 1000,
	min_seconds_to_resolution: 3600,
	staleness_pct: 3,
	trade_size_usdc: 1,
	exposure_cap_usdc: 5,
	working_capital_floor_usdc: 20,
	gas_reserve_pol: 2,
	slippage_pct: 1,
};

export type KnobUnit = "usdc" | "pct" | "count" | "seconds" | "pol";
export type KnobGroup = "gate" | "size" | "execution";

export interface Knob {
	readonly key: KnobKey;
	readonly group: KnobGroup;
	/** The knob's role in the story, in reader language — not the YAML key. */
	readonly label: string;
	readonly unit: KnobUnit;
	readonly min: number;
	readonly max: number;
	readonly step: number;
}

/** Section headings for the slider panel, phrased as the bot's own questions. */
export const KNOB_GROUP_LABELS: Record<KnobGroup, string> = {
	gate: "Should I touch this at all?",
	size: "How much can I put at risk?",
	execution: "How do I get filled?",
};

export const KNOB_GROUP_ORDER: readonly KnobGroup[] = ["gate", "size", "execution"];

export const KNOBS = [
	{
		key: "cluster_threshold",
		group: "gate",
		label: "How many skilled wallets count as a crowd",
		unit: "count",
		min: 1,
		max: 10,
		step: 1,
	},
	{
		key: "min_liquidity_usdc",
		group: "gate",
		label: "Skip markets thinner than",
		unit: "usdc",
		min: 0,
		max: 10000,
		step: 250,
	},
	{
		key: "min_seconds_to_resolution",
		group: "gate",
		label: "Skip markets resolving within",
		unit: "seconds",
		min: 0,
		max: 86400,
		step: 900,
	},
	{
		key: "staleness_pct",
		group: "gate",
		label: "Skip if the price already ran more than",
		unit: "pct",
		min: 0.5,
		max: 20,
		step: 0.5,
	},
	{
		key: "trade_size_usdc",
		group: "size",
		label: "Size of one bet",
		unit: "usdc",
		min: 0.5,
		max: 25,
		step: 0.5,
	},
	{
		key: "exposure_cap_usdc",
		group: "size",
		label: "Never hold more open than",
		unit: "usdc",
		min: 1,
		max: 100,
		step: 1,
	},
	{
		key: "working_capital_floor_usdc",
		group: "size",
		label: "Never let the balance drop below",
		unit: "usdc",
		min: 0,
		max: 200,
		step: 5,
	},
	{
		key: "gas_reserve_pol",
		group: "size",
		label: "Park this much for network gas",
		unit: "pol",
		min: 0,
		max: 20,
		step: 0.5,
	},
	{
		key: "slippage_pct",
		group: "execution",
		label: "Walk away rather than overpay by more than",
		unit: "pct",
		min: 0.1,
		max: 10,
		step: 0.1,
	},
] as const satisfies readonly Knob[];

/**
 * One made-up signal arriving at the bot. Every field is invented for the
 * walkthrough — these are illustrative shapes, never real alerts or real
 * positions (see the disclosure policy on the methodology page).
 */
export interface Scenario {
	readonly id: string;
	/** Short tab label. */
	readonly label: string;
	/** The made-up market the crowd bought into. */
	readonly market: string;
	readonly smartWallets: number;
	readonly liquidityUsdc: number;
	readonly secondsToResolution: number;
	/** How far the price moved since the crowd bought. */
	readonly priceDriftPct: number;
	/** What the order book is asking above fair price, right now. */
	readonly quotedSlippagePct: number;
	/** Value the bot already has open elsewhere. */
	readonly openExposureUsdc: number;
	/** Free balance in the copy-trade pool. */
	readonly balanceUsdc: number;
}

/**
 * `as const satisfies` (rather than a `readonly Scenario[]` annotation) keeps the
 * literal tuple type, so `SCENARIOS[0]` is a `Scenario` and not `Scenario |
 * undefined` — the initial SSR paint needs no array-access guard.
 */
export const SCENARIOS = [
	{
		id: "textbook",
		label: "Textbook buy",
		market: "Fed cuts rates at the September meeting",
		smartWallets: 4,
		liquidityUsdc: 4200,
		secondsToResolution: 21600,
		priceDriftPct: 1.1,
		quotedSlippagePct: 0.4,
		openExposureUsdc: 2,
		balanceUsdc: 28.4,
	},
	{
		id: "ends-soon",
		label: "Ends too soon",
		market: "CPI print comes in above forecast",
		smartWallets: 4,
		liquidityUsdc: 6800,
		secondsToResolution: 1320,
		priceDriftPct: 0.9,
		quotedSlippagePct: 0.3,
		openExposureUsdc: 1,
		balanceUsdc: 27.1,
	},
	{
		id: "thin",
		label: "Thin market",
		market: "Regional bank index closes green this quarter",
		smartWallets: 5,
		liquidityUsdc: 380,
		secondsToResolution: 259200,
		priceDriftPct: 1.4,
		quotedSlippagePct: 2.6,
		openExposureUsdc: 0,
		balanceUsdc: 26,
	},
	{
		id: "chased",
		label: "Price already ran",
		market: "Unemployment rate ticks up next release",
		smartWallets: 6,
		liquidityUsdc: 12400,
		secondsToResolution: 172800,
		priceDriftPct: 5.8,
		quotedSlippagePct: 0.5,
		openExposureUsdc: 1,
		balanceUsdc: 25.8,
	},
	{
		id: "lonely",
		label: "No crowd",
		market: "ECB holds through year end",
		smartWallets: 1,
		liquidityUsdc: 9100,
		secondsToResolution: 345600,
		priceDriftPct: 0.4,
		quotedSlippagePct: 0.4,
		openExposureUsdc: 0,
		balanceUsdc: 26,
	},
	{
		id: "full",
		label: "No room left",
		market: "Treasury 10y yield above 4.5% at month end",
		smartWallets: 4,
		liquidityUsdc: 5500,
		secondsToResolution: 28800,
		priceDriftPct: 1.2,
		quotedSlippagePct: 0.6,
		openExposureUsdc: 5,
		balanceUsdc: 31,
	},
] as const satisfies readonly Scenario[];

function withThousands(integerPart: string): string {
	return integerPart.replace(/\B(?=(\d{3})+$)/g, ",");
}

/** `1234.5` → `"$1,234.50"`, `1000` → `"$1,000"`. Hand-rolled so the output is
 * byte-identical in Node, the Workers runtime, and the browser. */
export function formatUsd(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
	const [whole = "0", fraction] = text.replace("-", "").split(".");
	const sign = rounded < 0 ? "-" : "";
	const body =
		fraction === undefined ? withThousands(whole) : `${withThousands(whole)}.${fraction}`;
	return `${sign}$${body}`;
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

export function formatKnobValue(unit: KnobUnit, value: number): string {
	switch (unit) {
		case "usdc":
			return formatUsd(value);
		case "pct":
			return formatPct(value);
		case "seconds":
			return formatDuration(value);
		case "pol":
			return `${value} POL`;
		case "count":
			return String(value);
	}
}

/**
 * `"4 skilled wallets"` / `"1 skilled wallet"`. Takes a plain `number` on
 * purpose: read off a `SCENARIOS` tuple member the count is a literal type, and
 * an inline ternary would be statically dead.
 */
export function formatWalletCount(count: number): string {
	return `${count} skilled ${count === 1 ? "wallet" : "wallets"}`;
}

export function knobsInGroup(group: KnobGroup): readonly Knob[] {
	return KNOBS.filter((knob) => knob.group === group);
}

const KNOB_KEYS: ReadonlySet<string> = new Set(KNOBS.map((knob) => knob.key));

/**
 * Narrows a raw `data-knob` attribute read off the DOM. The browser hands back
 * `string | undefined`, and a slider for a knob we no longer ship must not be
 * able to write a junk key into the value map.
 */
export function isKnobKey(value: string | undefined): value is KnobKey {
	return value !== undefined && KNOB_KEYS.has(value);
}
