/**
 * The wallet-copy executor's tunable surface, mirrored from `config/wallet_copy.yml`.
 *
 * Same contract as the cluster module: one const feeds the SSR-rendered
 * sliders, the client-side recompute, and the markdown table on the `.md` twin.
 *
 * Disclosure note: only *thresholds* live here. The two leaders appear solely
 * under their anonymous config labels (`leader-a`, `leader-b`) — their
 * addresses, the bot's own trading account, and the payout address are never
 * published anywhere on this site. The example signals below are invented, and
 * so are their balances.
 */

import { formattersFor, type SimFormatters } from "../locale-format";
import { SIM_UNITS_EN } from "../sim-units-en";

const EN_FORMATTERS = formattersFor("en", SIM_UNITS_EN);

/** The market family whose live config the defaults reflect. */
export const WALLET_CONFIG_MARKET = "Macro";
/** When those defaults were last read off the running executor. */
export const WALLET_CONFIG_AS_OF = "2026-08-14";

/** The venue's minimum order, in shares — checked at boot, not per order. */
export const VENUE_MIN_ORDER_SHARES = 5;

/** The two price grids live markets quote on; the boot check takes the worst. */
export const LIVE_TICK_SIZES = [0.001, 0.01] as const;

/** The anonymous config labels of the two mirrored wallets. */
export type LeaderId = "leader-a" | "leader-b";

export type WalletKnobKey =
	| "leader_a_min_notional_usdc"
	| "leader_b_min_notional_usdc"
	| "max_open_copies_per_leader"
	| "max_wallet_two_sided_ratio"
	| "min_liquidity_usdc"
	| "min_seconds_to_resolution"
	| "staleness_pct"
	| "staleness_min_ticks"
	| "max_entry_price"
	| "trade_size_usdc"
	| "exposure_cap_usdc"
	| "working_capital_floor_usdc"
	| "slippage_pct"
	| "slippage_min_ticks"
	| "trim_close_fraction";

export type WalletKnobValues = Record<WalletKnobKey, number>;

/**
 * The values running in production today. Typed as a total `Record`, so adding
 * a `WalletKnobKey` without a live value is a compile error rather than a
 * silent gap.
 */
export const WALLET_LIVE_CONFIG: WalletKnobValues = {
	// Per-leader conviction bars, each measured against that leader's own 90-day
	// position-size history — the same number would not mean the same thing.
	leader_a_min_notional_usdc: 500,
	leader_b_min_notional_usdc: 100,
	max_open_copies_per_leader: 2,
	// A *ratio* (min/max of buy vs sell notional over 48h), not a percentage.
	// 1.0 disables the rail; 0 would refuse any wallet with a single opposite fill.
	max_wallet_two_sided_ratio: 0.5,
	min_liquidity_usdc: 1000,
	min_seconds_to_resolution: 3600,
	staleness_pct: 3,
	staleness_min_ticks: 2,
	max_entry_price: 0.95,
	trade_size_usdc: 5,
	exposure_cap_usdc: 20,
	working_capital_floor_usdc: 5,
	slippage_pct: 1,
	slippage_min_ticks: 2,
	// A *fraction of the leader's peak position*, cumulative — not per fill.
	trim_close_fraction: 0.5,
};

/** The knob a given leader's conviction bar lives under. */
export function leaderKnobKey(leader: LeaderId): WalletKnobKey {
	return leader === "leader-a" ? "leader_a_min_notional_usdc" : "leader_b_min_notional_usdc";
}

export type WalletKnobUnit =
	| "usdc"
	| "pct"
	| "fraction"
	| "price"
	| "count"
	| "seconds"
	| "steps"
	| "ratio";

export type WalletKnobGroup = "conviction" | "gate" | "size" | "execution" | "exit";

export interface WalletKnob {
	readonly key: WalletKnobKey;
	readonly group: WalletKnobGroup;
	/** The knob's role in the story, in reader language — not the YAML key. */
	readonly label: string;
	/**
	 * Where the number lives in `config/wallet_copy.yml` — shown under the
	 * slider. Differs from `key` only for the per-leader bars, which the YAML
	 * nests under each leader entry.
	 */
	readonly yamlKey: string;
	readonly unit: WalletKnobUnit;
	readonly min: number;
	readonly max: number;
	readonly step: number;
}

/** Section headings for the slider panel, phrased as the bot's own questions. */
export const WALLET_KNOB_GROUP_LABELS: Record<WalletKnobGroup, string> = {
	conviction: "Does the leader really mean it?",
	gate: "Should I copy this at all?",
	size: "How much can I put at risk?",
	execution: "How do I get filled?",
	exit: "When do I leave?",
};

/** Groups the entry panel renders — the exit knob lives in its own widget. */
export const WALLET_ENTRY_GROUP_ORDER: readonly WalletKnobGroup[] = [
	"conviction",
	"gate",
	"size",
	"execution",
];

export const WALLET_KNOBS = [
	{
		key: "leader_a_min_notional_usdc",
		group: "conviction",
		label: "Copy leader-a only once their bet reaches",
		yamlKey: "leaders[leader-a].min_leader_notional_usdc",
		unit: "usdc",
		min: 0,
		max: 2000,
		step: 25,
	},
	{
		key: "leader_b_min_notional_usdc",
		group: "conviction",
		label: "Copy leader-b only once their bet reaches",
		yamlKey: "leaders[leader-b].min_leader_notional_usdc",
		unit: "usdc",
		min: 0,
		max: 2000,
		step: 25,
	},
	{
		key: "max_open_copies_per_leader",
		group: "gate",
		label: "Never run more copies of one leader than",
		yamlKey: "max_open_copies_per_leader",
		unit: "count",
		min: 1,
		max: 6,
		step: 1,
	},
	{
		key: "max_wallet_two_sided_ratio",
		group: "gate",
		label: "Refuse a leader trading both sides beyond",
		yamlKey: "max_wallet_two_sided_ratio",
		unit: "ratio",
		min: 0,
		max: 1,
		step: 0.05,
	},
	{
		key: "min_liquidity_usdc",
		group: "gate",
		label: "Skip markets thinner than",
		yamlKey: "min_liquidity_usdc",
		unit: "usdc",
		min: 0,
		max: 10000,
		step: 250,
	},
	{
		key: "min_seconds_to_resolution",
		group: "gate",
		label: "Skip markets resolving within",
		yamlKey: "min_seconds_to_resolution",
		unit: "seconds",
		min: 0,
		max: 86400,
		step: 900,
	},
	{
		key: "staleness_pct",
		group: "gate",
		label: "Skip if the price already ran more than",
		yamlKey: "staleness_pct",
		unit: "pct",
		min: 0.5,
		max: 20,
		step: 0.5,
	},
	{
		key: "staleness_min_ticks",
		group: "gate",
		label: "…but treat a move smaller than this as noise",
		yamlKey: "staleness_min_ticks",
		unit: "steps",
		min: 0,
		max: 6,
		step: 1,
	},
	{
		key: "max_entry_price",
		group: "gate",
		label: "Never pay more per share than",
		yamlKey: "max_entry_price",
		unit: "price",
		min: 0,
		max: 1,
		step: 0.01,
	},
	{
		key: "trade_size_usdc",
		group: "size",
		label: "Size of one copy",
		yamlKey: "trade_size_usdc",
		unit: "usdc",
		min: 0.5,
		max: 25,
		step: 0.5,
	},
	{
		key: "exposure_cap_usdc",
		group: "size",
		label: "Never hold more open than",
		yamlKey: "exposure_cap_usdc",
		unit: "usdc",
		min: 1,
		max: 100,
		step: 1,
	},
	{
		key: "working_capital_floor_usdc",
		group: "size",
		label: "Never let the spendable balance drop below",
		yamlKey: "working_capital_floor_usdc",
		unit: "usdc",
		min: 0,
		max: 200,
		step: 5,
	},
	{
		key: "slippage_pct",
		group: "execution",
		label: "Walk away rather than overpay by more than",
		yamlKey: "slippage_pct",
		unit: "pct",
		min: 0.1,
		max: 10,
		step: 0.1,
	},
	{
		key: "slippage_min_ticks",
		group: "execution",
		label: "…but always give the order at least this much room",
		yamlKey: "slippage_min_ticks",
		unit: "steps",
		min: 0,
		max: 6,
		step: 1,
	},
	{
		key: "trim_close_fraction",
		group: "exit",
		label: "Close everything once the leader has unwound",
		yamlKey: "trim_close_fraction",
		unit: "fraction",
		min: 0.05,
		max: 1,
		step: 0.05,
	},
] as const satisfies readonly WalletKnob[];

/**
 * One made-up leader signal arriving at the bot. Every field is invented for
 * the walkthrough — these are illustrative shapes, never real fills, real
 * positions or real balances (see the disclosure policy on the methodology
 * page). In particular, no scenario market is ever a market the bot really
 * holds.
 */
export interface WalletScenario {
	readonly id: string;
	/** Short tab label. */
	readonly label: string;
	/** The made-up market the leader traded. */
	readonly market: string;
	readonly leader: LeaderId;
	/** The leader's cumulative peak on this fresh bet, in held-token USDC. */
	readonly stakeUsdc: number;
	/** True when the conviction was expressed by selling the other outcome. */
	readonly viaSale: boolean;
	/** The leader's effective price on the outcome they hold. */
	readonly entryPrice: number;
	/** Cheapest ask on that same outcome right now — what a copy would pay. */
	readonly bestAsk: number;
	/** The market's own price right now — what the price ceiling is judged on. */
	readonly currentPrice: number;
	/** Smallest price step this market quotes on. */
	readonly tickSize: number;
	readonly liquidityUsdc: number;
	readonly secondsToResolution: number;
	/**
	 * min/max of the leader's buy vs sell notional on this bet over the last
	 * 48 hours, or `null` when the window held nothing to weigh. `null` stands
	 * the rail down — an empty window is "unmeasured", never a clean `0.0`.
	 */
	readonly flowRatio: number | null;
	/** Copies of this same leader the bot already has open. */
	readonly openCopiesForLeader: number;
	/** Value the bot already has open across both leaders. */
	readonly openExposureUsdc: number;
	/** Spendable balance in the wallet-copy account. */
	readonly balanceUsdc: number;
}

/**
 * `as const satisfies` keeps the literal tuple type, so `WALLET_SCENARIOS[0]`
 * is a `WalletScenario` and not `WalletScenario | undefined` — the initial SSR
 * paint needs no array-access guard.
 */
export const WALLET_SCENARIOS = [
	{
		id: "textbook",
		label: "Textbook copy",
		market: "US CPI prints below 3% year-over-year in September",
		leader: "leader-a",
		stakeUsdc: 650,
		viaSale: false,
		entryPrice: 0.64,
		bestAsk: 0.646,
		currentPrice: 0.644,
		tickSize: 0.001,
		liquidityUsdc: 5200,
		secondsToResolution: 21600,
		flowRatio: 0.08,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		// Under leader-a's $500 bar: the tracker never emits a signal at all.
		id: "small-poke",
		label: "Small poke",
		market: "ECB cuts rates in December",
		leader: "leader-a",
		stakeUsdc: 180,
		viaSale: false,
		entryPrice: 0.41,
		bestAsk: 0.412,
		currentPrice: 0.411,
		tickSize: 0.001,
		liquidityUsdc: 6900,
		secondsToResolution: 172800,
		flowRatio: 0.05,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		// The same dollars that are a poke for leader-a clear leader-b's own bar —
		// the bars are per leader because their position sizes differ 50-fold.
		id: "leader-b-bar",
		label: "leader-b's bar",
		market: "Gold closes the month above $3,000",
		leader: "leader-b",
		stakeUsdc: 140,
		viaSale: false,
		entryPrice: 0.56,
		bestAsk: 0.565,
		currentPrice: 0.562,
		tickSize: 0.001,
		liquidityUsdc: 3800,
		secondsToResolution: 259200,
		flowRatio: 0.1,
		openCopiesForLeader: 1,
		openExposureUsdc: 10,
		balanceUsdc: 18,
	},
	{
		// Conviction expressed by selling the other side — and a 7¢ ticket this
		// bot will happily buy, because it has no fee rail (its sibling does).
		id: "cheap-side",
		label: "Cheap side",
		market: "Bank of England hikes before spring",
		leader: "leader-b",
		stakeUsdc: 150,
		viaSale: true,
		entryPrice: 0.07,
		bestAsk: 0.071,
		currentPrice: 0.07,
		tickSize: 0.001,
		liquidityUsdc: 4400,
		secondsToResolution: 345600,
		flowRatio: 0.12,
		openCopiesForLeader: 0,
		openExposureUsdc: 10,
		balanceUsdc: 18,
	},
	{
		// leader-b's documented history is exactly why this rail is the one to
		// watch: a wallet trading both sides is making a market, not a claim.
		id: "two-sided",
		label: "Two-sided",
		market: "WTI crude ends the week above $80",
		leader: "leader-b",
		stakeUsdc: 160,
		viaSale: false,
		entryPrice: 0.52,
		bestAsk: 0.523,
		currentPrice: 0.521,
		tickSize: 0.001,
		liquidityUsdc: 7100,
		secondsToResolution: 86400,
		flowRatio: 0.78,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		// The 48h window held no flow at all: "unmeasured" is a fact the rail
		// refuses to dress up as a clean 0.0 — it stands down instead.
		id: "empty-window",
		label: "Empty window",
		market: "Unemployment above 4.5% at year end",
		leader: "leader-a",
		stakeUsdc: 800,
		viaSale: false,
		entryPrice: 0.33,
		bestAsk: 0.332,
		currentPrice: 0.331,
		tickSize: 0.001,
		liquidityUsdc: 5600,
		secondsToResolution: 432000,
		flowRatio: null,
		openCopiesForLeader: 1,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		id: "spree",
		label: "On a spree",
		market: "10-year Treasury yield above 5% by March",
		leader: "leader-a",
		stakeUsdc: 1200,
		viaSale: false,
		entryPrice: 0.29,
		bestAsk: 0.292,
		currentPrice: 0.291,
		tickSize: 0.001,
		liquidityUsdc: 8800,
		secondsToResolution: 604800,
		flowRatio: 0.06,
		openCopiesForLeader: 2,
		openExposureUsdc: 10,
		balanceUsdc: 18,
	},
	{
		id: "full",
		label: "No room left",
		market: "S&P 500 closes the week lower",
		leader: "leader-b",
		stakeUsdc: 130,
		viaSale: false,
		entryPrice: 0.47,
		bestAsk: 0.472,
		currentPrice: 0.471,
		tickSize: 0.001,
		liquidityUsdc: 9600,
		secondsToResolution: 172800,
		flowRatio: 0.15,
		openCopiesForLeader: 1,
		openExposureUsdc: 17.5,
		balanceUsdc: 12,
	},
	{
		id: "chased",
		label: "Price ran away",
		market: "Recession declared before July",
		leader: "leader-a",
		stakeUsdc: 950,
		viaSale: false,
		entryPrice: 0.55,
		bestAsk: 0.6,
		currentPrice: 0.598,
		tickSize: 0.001,
		liquidityUsdc: 11200,
		secondsToResolution: 259200,
		flowRatio: 0.07,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		id: "too-dear",
		label: "Too dear",
		market: "Fed chair serves out the year",
		leader: "leader-a",
		stakeUsdc: 900,
		viaSale: false,
		entryPrice: 0.965,
		bestAsk: 0.971,
		currentPrice: 0.97,
		tickSize: 0.001,
		liquidityUsdc: 15400,
		secondsToResolution: 864000,
		flowRatio: 0.04,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		id: "ends-soon",
		label: "Ends too soon",
		market: "Tomorrow's jobs report beats forecast",
		leader: "leader-b",
		stakeUsdc: 120,
		viaSale: false,
		entryPrice: 0.58,
		bestAsk: 0.582,
		currentPrice: 0.581,
		tickSize: 0.001,
		liquidityUsdc: 6200,
		secondsToResolution: 1320,
		flowRatio: 0.09,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		id: "thin",
		label: "Thin market",
		market: "Regional bank index closes the quarter green",
		leader: "leader-a",
		stakeUsdc: 700,
		viaSale: false,
		entryPrice: 0.36,
		bestAsk: 0.365,
		currentPrice: 0.362,
		tickSize: 0.001,
		liquidityUsdc: 420,
		secondsToResolution: 432000,
		flowRatio: 0.05,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 23,
	},
	{
		id: "broke",
		label: "No cash left",
		market: "Core inflation above target at year end",
		leader: "leader-b",
		stakeUsdc: 110,
		viaSale: false,
		entryPrice: 0.66,
		bestAsk: 0.662,
		currentPrice: 0.661,
		tickSize: 0.001,
		liquidityUsdc: 7400,
		secondsToResolution: 64800,
		flowRatio: 0.11,
		openCopiesForLeader: 0,
		openExposureUsdc: 5,
		balanceUsdc: 8.5,
	},
] as const satisfies readonly WalletScenario[];

/** A two-sided flow ratio: `0.78` → `"0.78"`, and at `1` the rail is off. */
export function formatRatio(value: number): string {
	return EN_FORMATTERS.ratio(value);
}

/**
 * A knob's live value as the reader sees it beside the slider and in the
 * `.md` table. Locale-aware through the optional formatter set (issue #74) —
 * omitted, it renders the canonical English strings.
 */
export function formatWalletKnobValue(
	unit: WalletKnobUnit,
	value: number,
	fmt: SimFormatters = EN_FORMATTERS,
): string {
	switch (unit) {
		case "usdc":
			return fmt.usd(value);
		case "pct":
			return fmt.pct(value);
		case "fraction":
			return fmt.fraction(value);
		case "price":
			return fmt.priceLimit(value);
		case "seconds":
			return fmt.duration(value);
		case "steps":
			return fmt.steps(value);
		case "count":
			return String(value);
		case "ratio":
			return fmt.ratio(value);
	}
}

export function walletKnobsInGroup(group: WalletKnobGroup): readonly WalletKnob[] {
	return WALLET_KNOBS.filter((knob) => knob.group === group);
}

const WALLET_KNOB_KEYS: ReadonlySet<string> = new Set(WALLET_KNOBS.map((knob) => knob.key));

/**
 * Narrows a raw `data-knob` attribute read off the DOM. The browser hands back
 * `string | undefined`, and a slider for a knob we no longer ship must not be
 * able to write a junk key into the value map.
 */
export function isWalletKnobKey(value: string | undefined): value is WalletKnobKey {
	return value !== undefined && WALLET_KNOB_KEYS.has(value);
}
