/**
 * The wallet-copy entry decision, as a pure function.
 *
 * `evaluateLeaderSignal` is the interface: knob values plus one incoming leader
 * signal in, an ordered verdict out. The same function runs server-side for the
 * initial SSR paint and again in the browser on every slider move, so the page
 * can never show a verdict the module would not produce. `evaluateTrim` is the
 * exit rule's own little decision, for the second widget.
 *
 * Three pipelines are modelled, and the distinction is load-bearing:
 *
 * - the venue's 5-share minimum belongs to **boot** — the service checks it
 *   against the worst price its own rails allow and refuses to start on a
 *   config that cannot trade, so a failure here is not a skip, it is a bot
 *   that never ran;
 * - the conviction bar belongs to the **tracker**, which emits an entry signal
 *   exactly once, when the leader's peak on a fresh bet first crosses their
 *   own bar — below it no signal exists, so there is nothing to refuse;
 * - everything else is the **executor's** risk gate, judging a signal that
 *   already exists, in the order the real engine asks its questions.
 *
 * The real executor short-circuits at the first failing check. Here every
 * check is evaluated so that moving *any* slider gives feedback; the check the
 * real bot would have stopped at is marked `blocker`.
 */

import {
	formatDuration,
	formatFraction,
	formatPct,
	formatPrice,
	formatShares,
	formatSteps,
	formatUsd,
} from "../format";
import { complement, roundTo, snapDown } from "../market-math";
import {
	formatRatio,
	LIVE_TICK_SIZES,
	leaderKnobKey,
	VENUE_MIN_ORDER_SHARES,
	type WalletKnobKey,
	type WalletKnobValues,
	type WalletScenario,
} from "./config";

// The verdict shapes stay module-private: every consumer (the Astro page, the
// client script, the tests) reads them off the evaluate functions' inferred
// return types, so exporting them would widen the interface for nobody.
type GateId =
	| "boot"
	| "conviction"
	| "cap"
	| "room"
	| "liquidity"
	| "timing"
	| "freshness"
	| "flow"
	| "price"
	| "floor";

/**
 * Which pipeline enforces a check. `"boot"` is the service refusing to start
 * at all; `"alert"` is the tracker deciding whether a signal exists; and
 * `"executor"` is the risk gate deciding what to do with one that does.
 */
type GateStage = "boot" | "alert" | "executor";

interface GateResult {
	readonly id: GateId;
	readonly stage: GateStage;
	/** The question the bot is asking itself, in reader language. */
	readonly question: string;
	/** The knob that moves this check. */
	readonly knob: WalletKnobKey;
	/** What the signal actually shows, e.g. `"$650 at peak"`. */
	readonly actual: string;
	/** The rule it is measured against, e.g. `"≥ $500"`. */
	readonly rule: string;
	readonly passed: boolean;
	/** True for the first failing check — where the real bot would stop. */
	readonly blocker: boolean;
	/** Why this check failed, in one sentence. Empty when it passed. */
	readonly because: string;
}

/**
 * `"no-signal"` is the absence of a decision (the tracker never fired) and
 * `"no-boot"` is the absence of a bot (the service refused this config at
 * startup) — neither is a refusal the executor made.
 */
type VerdictAction = "copy" | "skip" | "no-signal" | "no-boot";

interface Verdict {
	readonly action: VerdictAction;
	readonly gates: readonly GateResult[];
	readonly headline: string;
	readonly detail: string;
}

/** Same shape as {@link GateResult} minus the fields the ordering pass fills in. */
type GateCheck = Omit<GateResult, "blocker">;

/**
 * The highest limit price an entry order can legally reach under the current
 * knobs, taken across both price grids live markets quote on. The boot check
 * multiplies it by the venue's 5-share minimum: a ticket that cannot buy five
 * shares at this price is a config the service refuses to start with.
 */
function worstReachableLimit(values: WalletKnobValues): number {
	const ceiling = values.max_entry_price <= 0 ? 1 : values.max_entry_price;
	return Math.max(
		...LIVE_TICK_SIZES.map((tick) => {
			const reachable = snapDown(ceiling, tick) + values.slippage_min_ticks * tick;
			return Math.min(roundTo(reachable, 4), complement(tick));
		}),
	);
}

/** The smallest ticket the boot check accepts, rounded up to the cent. */
function minimumBootTicket(values: WalletKnobValues): number {
	return Math.ceil(VENUE_MIN_ORDER_SHARES * worstReachableLimit(values) * 100) / 100;
}

/** The order the bot would place: ask plus slippage room, snapped to the grid. */
interface OrderPlan {
	readonly limitPrice: number;
	readonly shares: number;
	/** How far the ask moved past the leader's entry, in price units. */
	readonly adverseMove: number;
	readonly driftPct: number;
	readonly adverseSteps: number;
}

function planOrder(values: WalletKnobValues, signal: WalletScenario): OrderPlan {
	const room = Math.max(
		(signal.bestAsk * values.slippage_pct) / 100,
		values.slippage_min_ticks * signal.tickSize,
	);
	const limitPrice = snapDown(signal.bestAsk + room, signal.tickSize);
	const adverseMove = roundTo(signal.bestAsk - signal.entryPrice, 4);
	return {
		limitPrice,
		shares: limitPrice > 0 ? values.trade_size_usdc / limitPrice : 0,
		adverseMove,
		driftPct: signal.entryPrice > 0 ? (adverseMove / signal.entryPrice) * 100 : 0,
		adverseSteps: signal.tickSize > 0 ? roundTo(adverseMove / signal.tickSize, 1) : 0,
	};
}

/**
 * The staleness rail, measured between the leader's effective price on the
 * held token and the ask a copy would pay now. One threshold, two arms, the
 * larger one binding: a percentage of a cheap outcome can be smaller than the
 * smallest move the grid can even show, so the step floor keeps sub-grid
 * flicker from reading as a move.
 */
function hasRunAway(values: WalletKnobValues, signal: WalletScenario, plan: OrderPlan): boolean {
	const allowed = Math.max(
		(signal.entryPrice * values.staleness_pct) / 100,
		values.staleness_min_ticks * signal.tickSize,
	);
	return plan.adverseMove > roundTo(allowed, 6);
}

function driftReadout(plan: OrderPlan): string {
	if (plan.adverseMove <= 0) return "moved in our favour";
	if (plan.adverseSteps <= 0) return formatPct(plan.driftPct);
	return `${formatPct(plan.driftPct)} (${formatSteps(plan.adverseSteps)})`;
}

/** The staleness rail as one readable rule, collapsing when the floor is off. */
function freshnessRule(values: WalletKnobValues): string {
	const pct = `≤ ${formatPct(values.staleness_pct)}`;
	if (values.staleness_min_ticks <= 0) return pct;
	return `${pct} or < ${formatSteps(values.staleness_min_ticks)}`;
}

/**
 * The two-sided flow rail. `null` evidence stands the rail down — an empty
 * 48-hour window is "unmeasured", which the executor refuses to dress up as a
 * clean `0.0`. A threshold of 1 is the off position: every ratio is ≤ 1.
 */
function isTwoSided(values: WalletKnobValues, signal: WalletScenario): boolean {
	if (values.max_wallet_two_sided_ratio >= 1) return false;
	if (signal.flowRatio === null) return false;
	return signal.flowRatio > values.max_wallet_two_sided_ratio;
}

/** The most a winning copy can return — what the price ceiling is about. */
function maxGain(values: WalletKnobValues, price: number): number {
	if (price <= 0) return 0;
	return (values.trade_size_usdc * (1 - price)) / price;
}

/**
 * Order matters: boot first (no bot without it), the tracker's bar second (no
 * signal without it), then the executor's own questions in the order the real
 * engine asks them — per-leader cap, exposure, liquidity, timing, staleness,
 * two-sided flow, price ceiling, spendable floor.
 *
 * The engine also runs a row of bookkeeping refusals this page deliberately
 * omits — unknown leader, disabled leader, uncatalogued or non-Macro market,
 * kill switch, a copy already open on this exact bet — because none of them is
 * a number you can turn.
 */
function checks(values: WalletKnobValues, signal: WalletScenario, plan: OrderPlan): GateCheck[] {
	const bar = values[leaderKnobKey(signal.leader)];
	const worstLimit = worstReachableLimit(values);
	const minTicket = minimumBootTicket(values);
	const wouldOpen = signal.openExposureUsdc + values.trade_size_usdc;
	const wouldLeave = signal.balanceUsdc - values.trade_size_usdc;

	return [
		{
			id: "boot",
			stage: "boot",
			question: "Can my ticket even buy 5 shares at the worst price I allow?",
			knob: "trade_size_usdc",
			actual: `${formatUsd(values.trade_size_usdc)} → ${formatShares(values.trade_size_usdc / worstLimit)} at ${formatPrice(worstLimit)}`,
			rule: `≥ ${formatUsd(minTicket)}`,
			passed: values.trade_size_usdc >= minTicket,
			because: `A ${formatUsd(values.trade_size_usdc)} ticket at the worst limit the other knobs allow (${formatPrice(worstLimit)}) buys under the venue's ${VENUE_MIN_ORDER_SHARES}-share minimum, so the service refuses to start on this config at all rather than fail one order at a time.`,
		},
		{
			id: "conviction",
			stage: "alert",
			question: `Has ${signal.leader} bet enough to mean it?`,
			knob: leaderKnobKey(signal.leader),
			actual: `${formatUsd(signal.stakeUsdc)} at peak`,
			rule: `≥ ${formatUsd(bar)}`,
			passed: signal.stakeUsdc >= bar,
			because: `${signal.leader}'s whole position on this bet peaked at ${formatUsd(signal.stakeUsdc)}, under their ${formatUsd(bar)} bar — the tracker never emits an entry signal, so the bot is never asked and nothing is recorded about it.`,
		},
		{
			id: "cap",
			stage: "executor",
			question: "Am I already copying this leader enough?",
			knob: "max_open_copies_per_leader",
			actual: `${signal.openCopiesForLeader} open for ${signal.leader}`,
			rule: `< ${values.max_open_copies_per_leader}`,
			passed: signal.openCopiesForLeader < values.max_open_copies_per_leader,
			because: `${signal.openCopiesForLeader} ${signal.openCopiesForLeader === 1 ? "copy" : "copies"} of ${signal.leader} ${signal.openCopiesForLeader === 1 ? "is" : "are"} already open, at the per-leader cap of ${values.max_open_copies_per_leader} — one leader on a spree cannot eat the whole budget.`,
		},
		{
			id: "room",
			stage: "executor",
			question: "Do I have room under my cap?",
			knob: "exposure_cap_usdc",
			actual: `${formatUsd(signal.openExposureUsdc)} open + ${formatUsd(values.trade_size_usdc)}`,
			rule: `≤ ${formatUsd(values.exposure_cap_usdc)}`,
			passed: wouldOpen <= values.exposure_cap_usdc,
			because: `${formatUsd(signal.openExposureUsdc)} is already open across both leaders; another ${formatUsd(values.trade_size_usdc)} copy would breach the ${formatUsd(values.exposure_cap_usdc)} cap.`,
		},
		{
			id: "liquidity",
			stage: "executor",
			question: "Is there anyone here to trade with?",
			knob: "min_liquidity_usdc",
			actual: formatUsd(signal.liquidityUsdc),
			rule: `≥ ${formatUsd(values.min_liquidity_usdc)}`,
			passed: signal.liquidityUsdc >= values.min_liquidity_usdc,
			because: `${formatUsd(signal.liquidityUsdc)} of liquidity is under the ${formatUsd(values.min_liquidity_usdc)} floor — easy to get in, hard to get out.`,
		},
		{
			id: "timing",
			stage: "executor",
			question: "Is this market about to end?",
			knob: "min_seconds_to_resolution",
			actual: formatDuration(signal.secondsToResolution),
			rule: `≥ ${formatDuration(values.min_seconds_to_resolution)}`,
			passed: signal.secondsToResolution >= values.min_seconds_to_resolution,
			because: `${formatDuration(signal.secondsToResolution)} left before resolution, under the ${formatDuration(values.min_seconds_to_resolution)} minimum — no room to get back out.`,
		},
		{
			id: "freshness",
			stage: "executor",
			question: "Has the price already run past the leader?",
			knob: "staleness_pct",
			actual: driftReadout(plan),
			rule: freshnessRule(values),
			passed: !hasRunAway(values, signal, plan),
			because: `The ask sits ${formatPct(plan.driftPct)} past the leader's ${formatPrice(signal.entryPrice)} entry (now ${formatPrice(signal.bestAsk)}), beyond the ${formatPct(values.staleness_pct)} limit and the ${formatSteps(values.staleness_min_ticks)} noise floor — the move already happened.`,
		},
		{
			id: "flow",
			stage: "executor",
			question: "Does this leader trade both sides of this bet?",
			knob: "max_wallet_two_sided_ratio",
			actual: signal.flowRatio === null ? "nothing to weigh" : formatRatio(signal.flowRatio),
			rule:
				values.max_wallet_two_sided_ratio >= 1
					? "off"
					: `≤ ${formatRatio(values.max_wallet_two_sided_ratio)}`,
			passed: !isTwoSided(values, signal),
			because:
				signal.flowRatio === null
					? ""
					: `Over the last 48 hours this leader's buy and sell flow on this bet sit at ${formatRatio(signal.flowRatio)} of each other, past the ${formatRatio(values.max_wallet_two_sided_ratio)} ceiling — a wallet trading both sides is making a market, not expressing a view, and every flip copied is a paid round trip.`,
		},
		{
			id: "price",
			stage: "executor",
			question: "Is a share too dear to be worth the downside?",
			knob: "max_entry_price",
			actual: formatPrice(signal.currentPrice),
			rule: values.max_entry_price <= 0 ? "off" : `≤ ${formatPrice(values.max_entry_price)}`,
			passed: values.max_entry_price <= 0 || signal.currentPrice <= values.max_entry_price,
			because: `The market prices this outcome at ${formatPrice(signal.currentPrice)}, over the ${formatPrice(values.max_entry_price)} ceiling — a copy could win at most ${formatUsd(maxGain(values, signal.currentPrice))} while still risking the whole ${formatUsd(values.trade_size_usdc)}.`,
		},
		{
			id: "floor",
			stage: "executor",
			question: "Will this take me below my floor?",
			knob: "working_capital_floor_usdc",
			actual: `${formatUsd(signal.balanceUsdc)} → ${formatUsd(wouldLeave)}`,
			rule: `≥ ${formatUsd(values.working_capital_floor_usdc)}`,
			passed: wouldLeave >= values.working_capital_floor_usdc,
			because: `A ${formatUsd(values.trade_size_usdc)} copy would leave ${formatUsd(wouldLeave)}, under the ${formatUsd(values.working_capital_floor_usdc)} spendable floor.`,
		},
	];
}

function copyDetail(values: WalletKnobValues, signal: WalletScenario, plan: OrderPlan): string {
	const order = `It sends a ${formatUsd(values.trade_size_usdc)} fill-or-kill order at a limit of ${formatPrice(plan.limitPrice)} — about ${formatShares(plan.shares)} — which fills completely or dies; a killed order is not retried.`;
	const hold = `Then it holds through small trims and sells the whole leg the moment ${signal.leader} has unwound ${formatFraction(values.trim_close_fraction)} of their peak — or flipped, or closed out.`;
	if (signal.viaSale) {
		return `The leader built this position by selling the other side, so the bot buys the outcome they actually hold, at ${formatPrice(signal.bestAsk)}. ${order} ${hold}`;
	}
	return `Every check passed. ${order} ${hold}`;
}

export function evaluateLeaderSignal(values: WalletKnobValues, signal: WalletScenario): Verdict {
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
			action: "copy",
			gates,
			headline: `COPY ${formatUsd(values.trade_size_usdc)}`,
			detail: copyDetail(values, signal, plan),
		};
	}

	// A boot failure is not a refusal either — there is no bot to refuse. The
	// service checks its own config at startup and never starts on this one.
	if (firstFailure.stage === "boot") {
		return {
			action: "no-boot",
			gates,
			headline: "REFUSED AT BOOT",
			detail: firstFailure.because,
		};
	}

	// A failure upstream of the executor is not a refusal it made — the signal
	// the executor would have judged was never emitted.
	if (firstFailure.stage === "alert") {
		return {
			action: "no-signal",
			gates,
			headline: "NO SIGNAL",
			detail: firstFailure.because,
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
 * A position built by selling carries the translation with it — the bot buys
 * the outcome the leader actually holds, and nothing else makes sense without
 * that.
 */
export function leaderSignalLine(signal: WalletScenario): {
	lead: string;
	market: string;
	trail: string;
} {
	const lead = `${signal.leader} built a ${formatUsd(signal.stakeUsdc)} position in`;
	const trail = signal.viaSale
		? `— by selling the other side, so the outcome they actually hold trades at ${formatPrice(signal.entryPrice)}, and that is what the bot would buy.`
		: `at ${formatPrice(signal.entryPrice)}.`;
	return { lead, market: signal.market, trail };
}

/**
 * The exit rule's own decision, for the "when does it leave" widget: the
 * leader has cumulatively sold `soldPctOfPeak` percent of their peak position
 * on a bet the bot copied. Below the threshold that is information; at or
 * above it, the whole leg goes at once.
 */
export function evaluateTrim(
	values: WalletKnobValues,
	soldPctOfPeak: number,
): { action: "hold" | "close"; headline: string; detail: string } {
	const reduced = soldPctOfPeak / 100;
	const threshold = formatFraction(values.trim_close_fraction);
	if (reduced < values.trim_close_fraction) {
		return {
			action: "hold",
			headline: "HOLD",
			detail: `The leader has unwound ${formatPct(soldPctOfPeak)} of their peak — under the ${threshold} line. That is information, not an exit: the bot writes it down and keeps the whole position.`,
		};
	}
	return {
		action: "close",
		headline: "CLOSE THE WHOLE LEG",
		detail: `${formatPct(soldPctOfPeak)} of the peak is gone — at or past the ${threshold} line. The bot sells the entire copy at once, never a slice: a proportional sliver can drop under the venue's ${VENUE_MIN_ORDER_SHARES}-share minimum and become unsellable.`,
	};
}

/**
 * The "in one sentence" summary, rewritten from whatever the knobs currently say.
 */
export function walletSummarySentence(values: WalletKnobValues): string {
	const flowClause =
		values.max_wallet_two_sided_ratio >= 1
			? "whatever their recent flow looks like,"
			: `and their recent flow on it is not two-sided beyond ${formatRatio(values.max_wallet_two_sided_ratio)},`;
	return [
		`When one of the two leaders builds at least ${formatUsd(values.leader_a_min_notional_usdc)}`,
		`(leader-a) or ${formatUsd(values.leader_b_min_notional_usdc)} (leader-b) of a fresh bet,`,
		flowClause,
		`and the market holds at least ${formatUsd(values.min_liquidity_usdc)} of liquidity,`,
		`has more than ${formatDuration(values.min_seconds_to_resolution)} left to run,`,
		`and the price has not run more than ${formatPct(values.staleness_pct)} past their entry`,
		`→ the bot buys ${formatUsd(values.trade_size_usdc)} of the outcome they hold,`,
		`pays at most ${formatPrice(values.max_entry_price)} a share`,
		`and ${formatPct(values.slippage_pct)} over the ask,`,
		`runs at most ${values.max_open_copies_per_leader} copies per leader`,
		`and ${formatUsd(values.exposure_cap_usdc)} open in total,`,
		`keeps ${formatUsd(values.working_capital_floor_usdc)} spendable,`,
		"holds through small trims,",
		`and sells the whole leg once that leader has unwound ${formatFraction(values.trim_close_fraction)} of their peak — or flipped, or closed.`,
	].join(" ");
}
