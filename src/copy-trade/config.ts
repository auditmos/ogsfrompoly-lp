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
 * value — publishing either address would leak the copytrading wallets. The
 * example signals below are invented, and so are their balances.
 */

/** The market whose live config the defaults reflect. */
export const CONFIG_MARKET = "Macro";
/** When those defaults were last read off the running executor. */
export const CONFIG_AS_OF = "2026-07-30";

export type KnobKey =
	| "cluster_threshold"
	| "min_liquidity_usdc"
	| "min_seconds_to_resolution"
	| "staleness_pct"
	| "staleness_min_ticks"
	| "trade_size_usdc"
	| "exposure_cap_usdc"
	| "working_capital_floor_usdc"
	| "gas_reserve_pol"
	| "slippage_pct"
	| "slippage_min_ticks";

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
	staleness_min_ticks: 2,
	trade_size_usdc: 5,
	exposure_cap_usdc: 20,
	working_capital_floor_usdc: 5,
	gas_reserve_pol: 2,
	slippage_pct: 1,
	slippage_min_ticks: 2,
};

export type KnobUnit = "usdc" | "pct" | "count" | "seconds" | "pol" | "steps";
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
		key: "staleness_min_ticks",
		group: "gate",
		label: "…but treat a move smaller than this as noise",
		unit: "steps",
		min: 0,
		max: 6,
		step: 1,
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
		label: "Never let the spendable balance drop below",
		unit: "usdc",
		min: 0,
		max: 200,
		step: 5,
	},
	{
		key: "gas_reserve_pol",
		group: "size",
		label: "Keep this much gas before any payout",
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
	{
		key: "slippage_min_ticks",
		group: "execution",
		label: "…but always give the order at least this much room",
		unit: "steps",
		min: 0,
		max: 6,
		step: 1,
	},
] as const satisfies readonly Knob[];

/**
 * One made-up signal arriving at the bot. Every field is invented for the
 * walkthrough — these are illustrative shapes, never real alerts, real
 * positions or real balances (see the disclosure policy on the methodology
 * page).
 */
export interface Scenario {
	readonly id: string;
	/** Short tab label. */
	readonly label: string;
	/** The made-up market the crowd traded. */
	readonly market: string;
	/** What the crowd did. A sale is copied by buying the *other* outcome. */
	readonly crowdSide: "bought" | "sold";
	readonly smartWallets: number;
	/** Price of the outcome the crowd traded, at the moment they traded it. */
	readonly crowdPrice: number;
	/** Price of that same outcome right now. */
	readonly currentPrice: number;
	/** Smallest price step this market quotes on. */
	readonly tickSize: number;
	/** Fewest shares the venue accepts in one order. */
	readonly minShares: number;
	readonly liquidityUsdc: number;
	readonly secondsToResolution: number;
	/** Value the bot already has open elsewhere. */
	readonly openExposureUsdc: number;
	/** Spendable balance in the copy-trade pool. */
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
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.36,
		currentPrice: 0.361,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 4200,
		secondsToResolution: 21600,
		openExposureUsdc: 5,
		balanceUsdc: 28.5,
	},
	{
		id: "mirror",
		label: "Crowd is selling",
		market: "Bank of Japan hikes before December",
		crowdSide: "sold",
		smartWallets: 4,
		crowdPrice: 0.9,
		currentPrice: 0.905,
		tickSize: 0.01,
		minShares: 5,
		liquidityUsdc: 6100,
		secondsToResolution: 172800,
		openExposureUsdc: 10,
		balanceUsdc: 21,
	},
	{
		id: "coarse",
		label: "Coarse grid",
		market: "Recession called before the next election",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.1,
		currentPrice: 0.115,
		tickSize: 0.01,
		minShares: 5,
		liquidityUsdc: 3300,
		secondsToResolution: 86400,
		openExposureUsdc: 5,
		balanceUsdc: 19,
	},
	{
		id: "pricey",
		label: "Pricey outcome",
		market: "Core inflation stays above target this year",
		crowdSide: "bought",
		smartWallets: 5,
		crowdPrice: 0.94,
		currentPrice: 0.945,
		tickSize: 0.01,
		minShares: 5,
		liquidityUsdc: 5200,
		secondsToResolution: 43200,
		openExposureUsdc: 0,
		balanceUsdc: 12,
	},
	{
		id: "ends-soon",
		label: "Ends too soon",
		market: "CPI print comes in above forecast",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.55,
		currentPrice: 0.552,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 6800,
		secondsToResolution: 1320,
		openExposureUsdc: 5,
		balanceUsdc: 24,
	},
	{
		id: "thin",
		label: "Thin market",
		market: "Regional bank index closes green this quarter",
		crowdSide: "bought",
		smartWallets: 5,
		crowdPrice: 0.3,
		currentPrice: 0.33,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 380,
		secondsToResolution: 259200,
		openExposureUsdc: 0,
		balanceUsdc: 26,
	},
	{
		id: "chased",
		label: "Price ran away",
		market: "Unemployment rate ticks up next release",
		crowdSide: "bought",
		smartWallets: 6,
		crowdPrice: 0.42,
		currentPrice: 0.45,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 12400,
		secondsToResolution: 172800,
		openExposureUsdc: 5,
		balanceUsdc: 25.5,
	},
	{
		id: "full",
		label: "No room left",
		market: "Treasury 10y yield above 4.5% at month end",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.61,
		currentPrice: 0.612,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 5500,
		secondsToResolution: 28800,
		openExposureUsdc: 20,
		balanceUsdc: 31,
	},
	{
		id: "broke",
		label: "No cash left",
		market: "ECB holds through year end",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.48,
		currentPrice: 0.481,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 7400,
		secondsToResolution: 64800,
		openExposureUsdc: 5,
		balanceUsdc: 8.5,
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
		case "steps":
			return formatSteps(value);
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
