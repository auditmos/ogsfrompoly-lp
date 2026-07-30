/**
 * The copy-trade entry decision, as a pure function.
 *
 * `evaluateSignal` is the whole interface: knob values plus one incoming signal
 * in, an ordered verdict out. The same function runs server-side for the initial
 * SSR paint and again in the browser on every slider move, so the page can never
 * show a verdict the module would not produce.
 *
 * Two things the executor does before it judges anything are modelled here as
 * well, because both change the numbers the rails see:
 *
 * - a crowd *selling* an outcome is copied by *buying* the other one (their
 *   prices sum to 1), so every price below is the price of the side we would
 *   really trade, not the side they traded;
 * - the order's limit is rounded onto the market's price grid, and both the
 *   slippage and staleness rails carry a floor in grid steps — a percentage of a
 *   cheap outcome can be smaller than the smallest move the venue can quote.
 *
 * The real executor short-circuits at the first failing check. Here every check
 * is evaluated so that moving *any* slider gives feedback; the check the real
 * bot would have stopped at is marked `blocker`.
 */

import {
	formatDuration,
	formatPct,
	formatPrice,
	formatShares,
	formatSteps,
	formatUsd,
	formatWalletCount,
	type KnobKey,
	type KnobValues,
	type Scenario,
} from "./config";

// The verdict shapes stay module-private: every consumer (the Astro page, the
// client script, the tests) reads them off `evaluateSignal`'s inferred return
// type, so exporting them would widen the interface for nobody.
type GateId = "crowd" | "room" | "liquidity" | "timing" | "freshness" | "floor" | "fill" | "size";

interface GateResult {
	readonly id: GateId;
	/** The question the bot is asking itself, in reader language. */
	readonly question: string;
	/** The knob that moves this check. */
	readonly knob: KnobKey;
	/** What the signal actually shows, e.g. `"4 wallets"`. */
	readonly actual: string;
	/** The rule it is measured against, e.g. `"≥ 3"`. */
	readonly rule: string;
	readonly passed: boolean;
	/** True for the first failing check — where the real bot would stop. */
	readonly blocker: boolean;
	/** Why this check failed, in one sentence. Empty when it passed. */
	readonly because: string;
}

type VerdictAction = "buy" | "skip";

interface Verdict {
	readonly action: VerdictAction;
	readonly gates: readonly GateResult[];
	readonly headline: string;
	readonly detail: string;
}

/** Same shape as {@link GateResult} minus the fields the ordering pass fills in. */
type GateCheck = Omit<GateResult, "blocker">;

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/** The other outcome's price. Rounded because `1 - 0.905` is `0.09499…`. */
function complement(price: number): number {
	return roundTo(1 - price, 4);
}

/**
 * Round a limit down onto the market's price grid, then keep it inside the
 * venue's own bounds. Down, not nearest: rounding up would let a fill land
 * outside the slippage the operator configured.
 */
function snapDown(price: number, tick: number): number {
	if (tick <= 0) return price;
	const steps = Math.floor(roundTo(price / tick, 6));
	const snapped = roundTo(steps * tick, 4);
	return Math.min(Math.max(snapped, tick), complement(tick));
}

/** The order the bot would actually place, after translating the crowd's side. */
interface OrderPlan {
	/** True when the crowd sold and the bot buys the opposite outcome instead. */
	readonly mirrored: boolean;
	/** Reference price on the side we buy. */
	readonly entryPrice: number;
	/** Live price on the side we buy. */
	readonly livePrice: number;
	/** How far the price moved *against* us, in price units. */
	readonly adverseMove: number;
	readonly driftPct: number;
	/** Same move counted in grid steps — what the noise floor is measured in. */
	readonly adverseSteps: number;
	readonly limitPrice: number;
	readonly shares: number;
}

function planOrder(values: KnobValues, signal: Scenario): OrderPlan {
	const mirrored = signal.crowdSide === "sold";
	const entryPrice = mirrored ? complement(signal.crowdPrice) : signal.crowdPrice;
	const livePrice = mirrored ? complement(signal.currentPrice) : signal.currentPrice;
	const adverseMove = roundTo(livePrice - entryPrice, 4);
	const room = Math.max(
		(entryPrice * values.slippage_pct) / 100,
		values.slippage_min_ticks * signal.tickSize,
	);
	const limitPrice = snapDown(entryPrice + room, signal.tickSize);
	return {
		mirrored,
		entryPrice,
		livePrice,
		adverseMove,
		driftPct: entryPrice > 0 ? (adverseMove / entryPrice) * 100 : 0,
		adverseSteps: signal.tickSize > 0 ? roundTo(adverseMove / signal.tickSize, 1) : 0,
		limitPrice,
		shares: limitPrice > 0 ? values.trade_size_usdc / limitPrice : 0,
	};
}

/**
 * The staleness rail needs *both* arms to trip. A percentage alone is
 * unsatisfiable on a cheap outcome — 3% of a $0.02 token is smaller than the
 * $0.001 step every market quotes on — so the smallest move the venue can even
 * show would read as stale. The floor says: a move the grid cannot subdivide is
 * noise, not information.
 */
function hasRunAway(values: KnobValues, plan: OrderPlan): boolean {
	if (plan.driftPct <= values.staleness_pct) return false;
	return plan.adverseSteps > values.staleness_min_ticks;
}

function driftReadout(plan: OrderPlan): string {
	if (plan.adverseMove <= 0) return "moved in our favour";
	// Under a tenth of a step there is no step count worth printing, and
	// `formatSteps` would render the "off" it uses for a disabled floor.
	if (plan.adverseSteps <= 0) return formatPct(plan.driftPct);
	return `${formatPct(plan.driftPct)} (${formatSteps(plan.adverseSteps)})`;
}

/** The staleness rail as one readable rule, collapsing when the floor is off. */
function freshnessRule(values: KnobValues): string {
	const pct = `≤ ${formatPct(values.staleness_pct)}`;
	if (values.staleness_min_ticks <= 0) return pct;
	return `${pct} or < ${formatSteps(values.staleness_min_ticks)}`;
}

/** Order matters: it is the order the executor asks the questions in. */
function checks(values: KnobValues, signal: Scenario, plan: OrderPlan): GateCheck[] {
	const wouldOpen = signal.openExposureUsdc + values.trade_size_usdc;
	const wouldLeave = signal.balanceUsdc - values.trade_size_usdc;
	const ranAway = hasRunAway(values, plan);

	return [
		{
			id: "crowd",
			question: "Is a crowd agreeing, not just one trader?",
			knob: "cluster_threshold",
			actual: `${signal.smartWallets} ${signal.smartWallets === 1 ? "wallet" : "wallets"}`,
			rule: `≥ ${values.cluster_threshold}`,
			passed: signal.smartWallets >= values.cluster_threshold,
			because: `Only ${formatWalletCount(signal.smartWallets)} traded it; the bot waits for ${values.cluster_threshold}.`,
		},
		{
			id: "room",
			question: "Do I have room under my cap?",
			knob: "exposure_cap_usdc",
			actual: `${formatUsd(signal.openExposureUsdc)} open + ${formatUsd(values.trade_size_usdc)}`,
			rule: `≤ ${formatUsd(values.exposure_cap_usdc)}`,
			passed: wouldOpen <= values.exposure_cap_usdc,
			because: `${formatUsd(signal.openExposureUsdc)} is already open; another ${formatUsd(values.trade_size_usdc)} ticket would breach the ${formatUsd(values.exposure_cap_usdc)} cap.`,
		},
		{
			id: "liquidity",
			question: "Is there anyone here to trade with?",
			knob: "min_liquidity_usdc",
			actual: formatUsd(signal.liquidityUsdc),
			rule: `≥ ${formatUsd(values.min_liquidity_usdc)}`,
			passed: signal.liquidityUsdc >= values.min_liquidity_usdc,
			because: `${formatUsd(signal.liquidityUsdc)} of liquidity is under the ${formatUsd(values.min_liquidity_usdc)} floor — easy to get in, hard to get out.`,
		},
		{
			id: "timing",
			question: "Is this market about to end?",
			knob: "min_seconds_to_resolution",
			actual: formatDuration(signal.secondsToResolution),
			rule: `≥ ${formatDuration(values.min_seconds_to_resolution)}`,
			passed: signal.secondsToResolution >= values.min_seconds_to_resolution,
			because: `${formatDuration(signal.secondsToResolution)} left before resolution, under the ${formatDuration(values.min_seconds_to_resolution)} minimum — no room to get back out.`,
		},
		{
			id: "freshness",
			question: "Has the price already run away?",
			knob: "staleness_pct",
			actual: driftReadout(plan),
			rule: freshnessRule(values),
			passed: !ranAway,
			because: `The price moved ${formatPct(plan.driftPct)} against us (${formatPrice(plan.entryPrice)} → ${formatPrice(plan.livePrice)}), past the ${formatPct(values.staleness_pct)} limit and past the ${formatSteps(values.staleness_min_ticks)} noise floor — the move already happened.`,
		},
		{
			id: "floor",
			question: "Will this take me below my floor?",
			knob: "working_capital_floor_usdc",
			actual: `${formatUsd(signal.balanceUsdc)} → ${formatUsd(wouldLeave)}`,
			rule: `≥ ${formatUsd(values.working_capital_floor_usdc)}`,
			passed: wouldLeave >= values.working_capital_floor_usdc,
			because: `A ${formatUsd(values.trade_size_usdc)} ticket would leave ${formatUsd(wouldLeave)}, under the ${formatUsd(values.working_capital_floor_usdc)} spendable floor.`,
		},
		{
			id: "fill",
			question: "Can I buy inside my own price limit?",
			knob: "slippage_pct",
			actual: `asks ${formatPrice(plan.livePrice)}`,
			rule: `≤ ${formatPrice(plan.limitPrice)}`,
			passed: plan.livePrice <= plan.limitPrice,
			because: `The cheapest ask is ${formatPrice(plan.livePrice)} and the bot's limit is ${formatPrice(plan.limitPrice)} — an all-or-nothing order at that limit is simply killed.`,
		},
		{
			id: "size",
			question: "Is the order big enough for the venue?",
			knob: "trade_size_usdc",
			actual: formatShares(plan.shares),
			rule: `≥ ${formatShares(signal.minShares)}`,
			passed: plan.shares >= signal.minShares,
			because: `${formatUsd(values.trade_size_usdc)} at a limit of ${formatPrice(plan.limitPrice)} buys only ${formatShares(plan.shares)}, and this venue refuses anything under ${formatShares(signal.minShares)}.`,
		},
	];
}

function buyDetail(values: KnobValues, plan: OrderPlan): string {
	const order = `It buys ${formatUsd(values.trade_size_usdc)} at a limit of ${formatPrice(plan.limitPrice)} — about ${formatShares(plan.shares)} — all-or-nothing, or not at all.`;
	if (plan.mirrored) {
		return `The crowd was selling, so the bot buys the opposite outcome at ${formatPrice(plan.entryPrice)} instead. ${order} It holds until the first of those wallets buys back what they sold.`;
	}
	return `Every check passed. ${order} It holds until the first of those wallets sells.`;
}

export function evaluateSignal(values: KnobValues, signal: Scenario): Verdict {
	const plan = planOrder(values, signal);
	const raw = checks(values, signal, plan);
	const firstFailure = raw.find((check) => !check.passed);

	const gates: GateResult[] = raw.map((check) => ({
		...check,
		blocker: check.id === firstFailure?.id,
		because: check.passed ? "" : check.because,
	}));

	if (!firstFailure) {
		return {
			action: "buy",
			gates,
			headline: `BUY ${formatUsd(values.trade_size_usdc)}`,
			detail: buyDetail(values, plan),
		};
	}

	return {
		action: "skip",
		gates,
		headline: "SKIP",
		detail: firstFailure.because,
	};
}

/**
 * The signal, in one sentence, split so the panel can style the market title.
 * A sale carries the translation with it — the price the bot would pay is on the
 * *other* outcome, and nothing else on the page makes sense without that.
 */
export function signalLine(signal: Scenario): {
	lead: string;
	market: string;
	trail: string;
} {
	const lead = `${formatWalletCount(signal.smartWallets)} ${signal.crowdSide}`;
	const trail =
		signal.crowdSide === "sold"
			? `at ${formatPrice(signal.crowdPrice)} — so the bot would buy the opposite outcome at ${formatPrice(complement(signal.crowdPrice))}.`
			: `at ${formatPrice(signal.crowdPrice)}.`;
	return { lead, market: signal.market, trail };
}

/**
 * The "in one sentence" summary, rewritten from whatever the knobs currently say.
 */
export function summarySentence(values: KnobValues): string {
	return [
		`When ${values.cluster_threshold}+ skilled wallets agree,`,
		`and the market holds at least ${formatUsd(values.min_liquidity_usdc)} of liquidity,`,
		`has more than ${formatDuration(values.min_seconds_to_resolution)} left to run,`,
		`and has not moved more than ${formatPct(values.staleness_pct)} against them`,
		`→ the bot buys ${formatUsd(values.trade_size_usdc)} of what they bought`,
		"(or of the opposite outcome, if they were selling),",
		`without paying more than ${formatPct(values.slippage_pct)} over the price they got,`,
		"holds until the first of them reverses,",
		`keeps ${formatUsd(values.working_capital_floor_usdc)} spendable and ${values.gas_reserve_pol} POL back for gas,`,
		`and repeats with never more than ${formatUsd(values.exposure_cap_usdc)} in play at once.`,
	].join(" ");
}
