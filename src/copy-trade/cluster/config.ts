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

import { formattersFor, type SimFormatters } from "../locale-format";
import { SIM_UNITS_EN } from "../sim-units-en";

const EN_FORMATTERS = formattersFor("en", SIM_UNITS_EN);

/** The market whose live config the defaults reflect. */
export const CONFIG_MARKET = "Macro";
/** When those defaults were last read off the running executor. */
export const CONFIG_AS_OF = "2026-08-07";

export type KnobKey =
	| "cluster_threshold"
	| "min_liquidity_usdc"
	| "min_seconds_to_resolution"
	| "staleness_pct"
	| "staleness_min_ticks"
	| "reversal_lookback_s"
	| "max_reversed_wallets"
	| "max_entry_fee_pct"
	| "max_entry_price"
	| "trade_size_usdc"
	| "exposure_cap_usdc"
	| "working_capital_floor_usdc"
	| "gas_reserve_pol"
	| "slippage_pct"
	| "slippage_min_ticks"
	| "auto_close_loss_pct"
	| "auto_close_profit_pct";

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
	reversal_lookback_s: 600,
	// `0` is the STRICTEST setting here, not the disabled one — any contributing
	// wallet that flipped inside the window refuses the whole crowd. The rail is
	// switched off by `reversal_lookback_s: 0` instead.
	max_reversed_wallets: 0,
	// A *fraction* of the ticket, not a percentage, because that is how the YAML
	// carries it. Rendered as "2%" by the `fraction` unit.
	max_entry_fee_pct: 0.02,
	max_entry_price: 0.95,
	trade_size_usdc: 5,
	exposure_cap_usdc: 20,
	working_capital_floor_usdc: 5,
	gas_reserve_pol: 2,
	slippage_pct: 1,
	slippage_min_ticks: 2,
	// Both `0` because `config/copy_trade.yml` carries neither key: the
	// auto-close rail is deployed and deliberately disarmed. Arming it is an
	// operator act, and the values chosen are never published — see the
	// disclosure policy on the methodology page.
	auto_close_loss_pct: 0,
	auto_close_profit_pct: 0,
};

/**
 * The venue's fee curve is shared with the wallet bot and the auto-close rail,
 * so it lives in `market-math.ts` now (`VENUE_FEE_RATE`, `platformFeeUsdc`).
 *
 * One detail belongs to this bot rather than to the curve: when a market
 * publishes no schedule the executor does not stand the fee rail down —
 * `CopyConfig.fee_fallback` supplies an assumed curve, and the live Macro
 * config declares no `fee_fallback` block, so the default 5% is what the rail
 * judges against. That is deliberate — a zero would be indistinguishable from a
 * genuinely free market — but it means a market that truly charges nothing can
 * still be refused by `max_entry_fee_pct`. It also means the executor's
 * `fee_unavailable` skip cannot fire on the live config, which is why this page
 * does not show it as a rail.
 */

export type KnobUnit =
	| "usdc"
	| "pct"
	/** A percentage that can be stood down, where `0` reads as off. */
	| "pct_limit"
	| "fraction"
	| "price"
	| "count"
	| "seconds"
	| "pol"
	| "steps";
export type KnobGroup = "gate" | "size" | "execution" | "exit";

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
	exit: "When do I get out on my own numbers?",
};

/** Groups the entry panel renders, in the order the executor asks them. */
export const KNOB_GROUP_ORDER: readonly KnobGroup[] = ["gate", "size", "execution"];

/**
 * Groups the exit widget renders. Split from the entry order rather than
 * appended to it: the auto-close thresholds judge a position the bot already
 * holds, and putting their sliders among the entry rails would suggest they
 * have a say in whether it buys.
 */
export const EXIT_GROUP_ORDER: readonly KnobGroup[] = ["exit"];

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
		key: "reversal_lookback_s",
		group: "gate",
		label: "Skip if one of them was on the other side within",
		unit: "seconds",
		min: 0,
		max: 3600,
		step: 60,
	},
	{
		key: "max_reversed_wallets",
		group: "gate",
		// Reads as a tolerance, and at its live value it is none at all. Worth a
		// slider precisely because "0" looks like "off" and is the opposite.
		label: "…tolerating at most this many of them having flipped",
		unit: "count",
		min: 0,
		max: 3,
		step: 1,
	},
	{
		key: "max_entry_fee_pct",
		group: "gate",
		label: "Skip if the entry fee eats more of the ticket than",
		unit: "fraction",
		min: 0,
		max: 0.05,
		step: 0.005,
	},
	{
		key: "max_entry_price",
		group: "gate",
		label: "Never pay more per share than",
		unit: "price",
		min: 0,
		max: 1,
		step: 0.01,
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
	{
		key: "auto_close_loss_pct",
		group: "exit",
		label: "Sell if the position is down more than",
		unit: "pct_limit",
		min: 0,
		// The executor refuses to boot above 100: a position cannot lose more than
		// the ticket, so a larger number is a threshold nothing can reach.
		max: 100,
		step: 5,
	},
	{
		key: "auto_close_profit_pct",
		group: "exit",
		label: "Sell if it is up more than",
		unit: "pct_limit",
		min: 0,
		// No upper bound upstream — a cheap outcome can multiply many times over.
		// 200 is where the slider stops being useful, not where the rule does.
		max: 200,
		step: 5,
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
	/**
	 * The same wallets caught on the *opposite* side of this market recently, or
	 * `null` when none of them was.
	 *
	 * `null` is "we looked and nobody flipped", which is a fact the rail may act
	 * on — not "we did not look". The executor draws the same distinction, and
	 * stands the rail down entirely when nothing measured it.
	 *
	 * One nullable object rather than a count beside a timestamp, so a row can
	 * never claim two wallets flipped and no flip happened.
	 */
	readonly crowdFlip: {
		/** How many of `smartWallets` were on the other side. */
		readonly wallets: number;
		/** The tightest of those flips — the number to read the window against. */
		readonly secondsAgo: number;
	} | null;
}

/**
 * `as const satisfies` (rather than a `readonly Scenario[]` annotation) keeps the
 * literal tuple type, so `SCENARIOS[0]` is a `Scenario` and not `Scenario |
 * undefined` — the initial SSR paint needs no array-access guard.
 */
export const SCENARIOS = [
	{
		id: "textbook",
		// $0.64, not the $0.36 this example used to carry. The fee rail is a
		// minimum-price gate in disguise — `rate * (1 - price)` is under 2% only
		// at or above $0.60 — so a 36¢ ticket is a trade the live bot refuses, and
		// an example that bought one would teach a decision it cannot make.
		label: "Textbook buy",
		market: "Fed cuts rates at the September meeting",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.64,
		currentPrice: 0.641,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 4200,
		secondsToResolution: 21600,
		openExposureUsdc: 5,
		balanceUsdc: 28.5,
		crowdFlip: null,
	},
	{
		// The crowd sells a *cheap* outcome, so our side is the dear one. Selling
		// a 90¢ outcome would land us on a 10¢ ticket, which the fee rail refuses
		// outright — the mirror only survives when their side is under 40¢.
		id: "mirror",
		label: "Crowd is selling",
		market: "Bank of Japan hikes before December",
		crowdSide: "sold",
		smartWallets: 4,
		crowdPrice: 0.3,
		currentPrice: 0.305,
		tickSize: 0.01,
		minShares: 5,
		liquidityUsdc: 6100,
		secondsToResolution: 172800,
		openExposureUsdc: 10,
		balanceUsdc: 21,
		crowdFlip: null,
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
		crowdFlip: null,
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
		crowdFlip: null,
	},
	{
		id: "too-dear",
		label: "Too dear",
		market: "Bank of Japan holds rates this meeting",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.97,
		currentPrice: 0.971,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 9100,
		secondsToResolution: 86400,
		openExposureUsdc: 5,
		balanceUsdc: 26,
		crowdFlip: null,
	},
	{
		id: "flipped",
		label: "Crowd just flipped",
		market: "Fed hikes at the next meeting",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.64,
		currentPrice: 0.641,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 7300,
		secondsToResolution: 86400,
		openExposureUsdc: 5,
		balanceUsdc: 27,
		// Two of the four flipped, 121 s ago — the middle of the three flips
		// actually recorded (3 s, 121 s, 7 min), and the shape of the live one.
		crowdFlip: { wallets: 2, secondsAgo: 121 },
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
		crowdFlip: null,
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
		crowdFlip: null,
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
		crowdFlip: null,
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
		crowdFlip: null,
	},
	{
		// $0.66 rather than $0.48: the spendable floor is asked *after* the fee
		// rail, so a 48¢ ticket would now be refused for its fee and never reach
		// the check this example exists to show.
		id: "broke",
		label: "No cash left",
		market: "ECB holds through year end",
		crowdSide: "bought",
		smartWallets: 4,
		crowdPrice: 0.66,
		currentPrice: 0.661,
		tickSize: 0.001,
		minShares: 5,
		liquidityUsdc: 7400,
		secondsToResolution: 64800,
		openExposureUsdc: 5,
		balanceUsdc: 8.5,
		crowdFlip: null,
	},
] as const satisfies readonly Scenario[];

/**
 * A knob's live value as the reader sees it beside the slider and in the
 * `.md` table. Locale-aware through the optional formatter set (issue #73) —
 * omitted, it renders the canonical English strings. `POL` is a token symbol
 * and `count` a bare number, so neither varies by locale.
 */
export function formatKnobValue(
	unit: KnobUnit,
	value: number,
	fmt: SimFormatters = EN_FORMATTERS,
): string {
	switch (unit) {
		case "usdc":
			return fmt.usd(value);
		case "pct":
			return fmt.pct(value);
		case "pct_limit":
			return fmt.pctLimit(value);
		case "fraction":
			return fmt.fraction(value);
		case "price":
			return fmt.priceLimit(value);
		case "seconds":
			return fmt.duration(value);
		case "pol":
			return `${value} POL`;
		case "steps":
			return fmt.steps(value);
		case "count":
			return String(value);
	}
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
