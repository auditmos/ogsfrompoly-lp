/**
 * The wallet-copy entry decision, as a pure function.
 *
 * `evaluateLeaderSignal` is the interface: knob values plus one incoming leader
 * signal in, an ordered verdict out. The same function runs server-side for the
 * initial SSR paint and again in the browser on every slider move, so the page
 * can never show a verdict the module would not produce. `evaluateTrim` is the
 * exit rule's own little decision, for the second widget.
 *
 * Localization (issue #74) reuses the cluster mechanism unchanged: an optional
 * `WalletSimLocale` bundle carries the catalog-resolved templates and shared
 * unit words plus the locale whose number conventions format the values. The
 * decision path never reads it, and omitting it yields the canonical English
 * verdicts. `{leader}` placeholders are always filled with the anonymous
 * config labels (`leader-a` / `leader-b`), never translated.
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

import type { Locale } from "@/i18n/catalog";
import { fillTemplate, formattersFor, type SimFormatters } from "../locale-format";
import { complement, roundTo, snapDown } from "../market-math";
import { SIM_UNITS_EN, type SimUnits } from "../sim-units-en";
import {
	LIVE_TICK_SIZES,
	leaderKnobKey,
	VENUE_MIN_ORDER_SHARES,
	type WalletKnobKey,
	type WalletKnobValues,
	type WalletScenario,
} from "./config";
import { WALLET_SIM_EN, type WalletSimStrings } from "./sim-prose-en";

/**
 * Everything one locale needs to speak the simulator's mind — plain data end
 * to end, so the SSR page can hand it to the client script as JSON and both
 * sides recompute the identical strings.
 */
export interface WalletSimLocale {
	readonly locale: Locale;
	readonly units: SimUnits;
	readonly strings: WalletSimStrings;
}

const EN_SIM: WalletSimLocale = { locale: "en", units: SIM_UNITS_EN, strings: WALLET_SIM_EN };

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

function driftReadout(plan: OrderPlan, sim: WalletSimLocale, fmt: SimFormatters): string {
	if (plan.adverseMove <= 0) return sim.strings.drift.favour;
	if (plan.adverseSteps <= 0) return fmt.pct(plan.driftPct);
	return `${fmt.pct(plan.driftPct)} (${fmt.steps(plan.adverseSteps)})`;
}

/** The staleness rail as one readable rule, collapsing when the floor is off. */
function freshnessRule(values: WalletKnobValues, sim: WalletSimLocale, fmt: SimFormatters): string {
	const pct = fmt.pct(values.staleness_pct);
	if (values.staleness_min_ticks <= 0) {
		return fillTemplate(sim.strings.gates.freshness.rulePctOnly, { pct });
	}
	return fillTemplate(sim.strings.gates.freshness.ruleWithFloor, {
		pct,
		steps: fmt.steps(values.staleness_min_ticks),
	});
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
function checks(
	values: WalletKnobValues,
	signal: WalletScenario,
	plan: OrderPlan,
	sim: WalletSimLocale,
	fmt: SimFormatters,
): GateCheck[] {
	const bar = values[leaderKnobKey(signal.leader)];
	const worstLimit = worstReachableLimit(values);
	const minTicket = minimumBootTicket(values);
	const wouldOpen = signal.openExposureUsdc + values.trade_size_usdc;
	const wouldLeave = signal.balanceUsdc - values.trade_size_usdc;
	const gates = sim.strings.gates;
	const size = fmt.usd(values.trade_size_usdc);
	const minShares = String(VENUE_MIN_ORDER_SHARES);

	return [
		{
			id: "boot",
			stage: "boot",
			question: fillTemplate(gates.boot.question, { min: minShares }),
			knob: "trade_size_usdc",
			actual: fillTemplate(gates.boot.actual, {
				size,
				shares: fmt.shares(values.trade_size_usdc / worstLimit),
				limit: fmt.price(worstLimit),
			}),
			rule: `≥ ${fmt.usd(minTicket)}`,
			passed: values.trade_size_usdc >= minTicket,
			because: fillTemplate(gates.boot.because, {
				size,
				limit: fmt.price(worstLimit),
				min: minShares,
			}),
		},
		{
			id: "conviction",
			stage: "alert",
			question: fillTemplate(gates.conviction.question, { leader: signal.leader }),
			knob: leaderKnobKey(signal.leader),
			actual: fillTemplate(gates.conviction.actual, { stake: fmt.usd(signal.stakeUsdc) }),
			rule: `≥ ${fmt.usd(bar)}`,
			passed: signal.stakeUsdc >= bar,
			because: fillTemplate(gates.conviction.because, {
				leader: signal.leader,
				stake: fmt.usd(signal.stakeUsdc),
				bar: fmt.usd(bar),
			}),
		},
		{
			id: "cap",
			stage: "executor",
			question: gates.cap.question,
			knob: "max_open_copies_per_leader",
			actual: fillTemplate(gates.cap.actual, {
				n: String(signal.openCopiesForLeader),
				leader: signal.leader,
			}),
			rule: `< ${values.max_open_copies_per_leader}`,
			passed: signal.openCopiesForLeader < values.max_open_copies_per_leader,
			because: fillTemplate(fmt.pluralize(gates.cap.because, signal.openCopiesForLeader), {
				leader: signal.leader,
				cap: String(values.max_open_copies_per_leader),
			}),
		},
		{
			id: "room",
			stage: "executor",
			question: gates.room.question,
			knob: "exposure_cap_usdc",
			actual: fillTemplate(gates.room.actual, {
				open: fmt.usd(signal.openExposureUsdc),
				size,
			}),
			rule: `≤ ${fmt.usd(values.exposure_cap_usdc)}`,
			passed: wouldOpen <= values.exposure_cap_usdc,
			because: fillTemplate(gates.room.because, {
				open: fmt.usd(signal.openExposureUsdc),
				size,
				cap: fmt.usd(values.exposure_cap_usdc),
			}),
		},
		{
			id: "liquidity",
			stage: "executor",
			question: gates.liquidity.question,
			knob: "min_liquidity_usdc",
			actual: fmt.usd(signal.liquidityUsdc),
			rule: `≥ ${fmt.usd(values.min_liquidity_usdc)}`,
			passed: signal.liquidityUsdc >= values.min_liquidity_usdc,
			because: fillTemplate(gates.liquidity.because, {
				liquidity: fmt.usd(signal.liquidityUsdc),
				floor: fmt.usd(values.min_liquidity_usdc),
			}),
		},
		{
			id: "timing",
			stage: "executor",
			question: gates.timing.question,
			knob: "min_seconds_to_resolution",
			actual: fmt.duration(signal.secondsToResolution),
			rule: `≥ ${fmt.duration(values.min_seconds_to_resolution)}`,
			passed: signal.secondsToResolution >= values.min_seconds_to_resolution,
			because: fillTemplate(gates.timing.because, {
				left: fmt.duration(signal.secondsToResolution),
				min: fmt.duration(values.min_seconds_to_resolution),
			}),
		},
		{
			id: "freshness",
			stage: "executor",
			question: gates.freshness.question,
			knob: "staleness_pct",
			actual: driftReadout(plan, sim, fmt),
			rule: freshnessRule(values, sim, fmt),
			passed: !hasRunAway(values, signal, plan),
			because: fillTemplate(gates.freshness.because, {
				drift: fmt.pct(plan.driftPct),
				entry: fmt.price(signal.entryPrice),
				ask: fmt.price(signal.bestAsk),
				limit: fmt.pct(values.staleness_pct),
				floor: fmt.steps(values.staleness_min_ticks),
			}),
		},
		{
			id: "flow",
			stage: "executor",
			question: gates.flow.question,
			knob: "max_wallet_two_sided_ratio",
			actual: signal.flowRatio === null ? gates.flow.actualNone : fmt.ratio(signal.flowRatio),
			rule:
				values.max_wallet_two_sided_ratio >= 1
					? sim.units.off
					: `≤ ${fmt.ratio(values.max_wallet_two_sided_ratio)}`,
			passed: !isTwoSided(values, signal),
			because:
				signal.flowRatio === null
					? ""
					: fillTemplate(gates.flow.because, {
							ratio: fmt.ratio(signal.flowRatio),
							ceiling: fmt.ratio(values.max_wallet_two_sided_ratio),
						}),
		},
		{
			id: "price",
			stage: "executor",
			question: gates.price.question,
			knob: "max_entry_price",
			actual: fmt.price(signal.currentPrice),
			rule: values.max_entry_price <= 0 ? sim.units.off : `≤ ${fmt.price(values.max_entry_price)}`,
			passed: values.max_entry_price <= 0 || signal.currentPrice <= values.max_entry_price,
			because: fillTemplate(gates.price.because, {
				price: fmt.price(signal.currentPrice),
				ceiling: fmt.price(values.max_entry_price),
				gain: fmt.usd(maxGain(values, signal.currentPrice)),
				size,
			}),
		},
		{
			id: "floor",
			stage: "executor",
			question: gates.floor.question,
			knob: "working_capital_floor_usdc",
			actual: `${fmt.usd(signal.balanceUsdc)} → ${fmt.usd(wouldLeave)}`,
			rule: `≥ ${fmt.usd(values.working_capital_floor_usdc)}`,
			passed: wouldLeave >= values.working_capital_floor_usdc,
			because: fillTemplate(gates.floor.because, {
				size,
				left: fmt.usd(wouldLeave),
				floor: fmt.usd(values.working_capital_floor_usdc),
			}),
		},
	];
}

function copyDetail(
	values: WalletKnobValues,
	signal: WalletScenario,
	plan: OrderPlan,
	sim: WalletSimLocale,
	fmt: SimFormatters,
): string {
	const order = fillTemplate(sim.strings.detail.order, {
		size: fmt.usd(values.trade_size_usdc),
		limit: fmt.price(plan.limitPrice),
		shares: fmt.shares(plan.shares),
	});
	const hold = fillTemplate(sim.strings.detail.hold, {
		leader: signal.leader,
		threshold: fmt.fraction(values.trim_close_fraction),
	});
	if (signal.viaSale) {
		return fillTemplate(sim.strings.detail.copyViaSale, {
			ask: fmt.price(signal.bestAsk),
			order,
			hold,
		});
	}
	return fillTemplate(sim.strings.detail.copy, { order, hold });
}

export function evaluateLeaderSignal(
	values: WalletKnobValues,
	signal: WalletScenario,
	sim: WalletSimLocale = EN_SIM,
): Verdict {
	const fmt = formattersFor(sim.locale, sim.units);
	const plan = planOrder(values, signal);
	const raw = checks(values, signal, plan, sim, fmt);
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
			headline: fillTemplate(sim.strings.verdict.copy, {
				size: fmt.usd(values.trade_size_usdc),
			}),
			detail: copyDetail(values, signal, plan, sim, fmt),
		};
	}

	// A boot failure is not a refusal either — there is no bot to refuse. The
	// service checks its own config at startup and never starts on this one.
	if (firstFailure.stage === "boot") {
		return {
			action: "no-boot",
			gates,
			headline: sim.strings.verdict.noBoot,
			detail: firstFailure.because,
		};
	}

	// A failure upstream of the executor is not a refusal it made — the signal
	// the executor would have judged was never emitted.
	if (firstFailure.stage === "alert") {
		return {
			action: "no-signal",
			gates,
			headline: sim.strings.verdict.noSignal,
			detail: firstFailure.because,
		};
	}

	return {
		action: "skip",
		gates,
		headline: sim.strings.verdict.skip,
		detail: firstFailure.because,
	};
}

/**
 * The signal, in one sentence, split so the panel can style the market title.
 * A position built by selling carries the translation with it — the bot buys
 * the outcome the leader actually holds, and nothing else makes sense without
 * that. The invented market titles are quoted as-is in every locale.
 */
export function leaderSignalLine(
	signal: WalletScenario,
	sim: WalletSimLocale = EN_SIM,
): {
	lead: string;
	market: string;
	trail: string;
} {
	const fmt = formattersFor(sim.locale, sim.units);
	const lead = fillTemplate(sim.strings.signal.lead, {
		leader: signal.leader,
		stake: fmt.usd(signal.stakeUsdc),
	});
	const trail = fillTemplate(
		signal.viaSale ? sim.strings.signal.trailViaSale : sim.strings.signal.trail,
		{ entry: fmt.price(signal.entryPrice) },
	);
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
	sim: WalletSimLocale = EN_SIM,
): { action: "hold" | "close"; headline: string; detail: string } {
	const fmt = formattersFor(sim.locale, sim.units);
	const reduced = soldPctOfPeak / 100;
	const threshold = fmt.fraction(values.trim_close_fraction);
	if (reduced < values.trim_close_fraction) {
		return {
			action: "hold",
			headline: sim.strings.trim.holdHeadline,
			detail: fillTemplate(sim.strings.trim.holdDetail, {
				sold: fmt.pct(soldPctOfPeak),
				threshold,
			}),
		};
	}
	return {
		action: "close",
		headline: sim.strings.trim.closeHeadline,
		detail: fillTemplate(sim.strings.trim.closeDetail, {
			sold: fmt.pct(soldPctOfPeak),
			threshold,
			min: String(VENUE_MIN_ORDER_SHARES),
		}),
	};
}

/**
 * The "in one sentence" summary, rewritten from whatever the knobs currently say.
 */
export function walletSummarySentence(
	values: WalletKnobValues,
	sim: WalletSimLocale = EN_SIM,
): string {
	const fmt = formattersFor(sim.locale, sim.units);
	const flowClause =
		values.max_wallet_two_sided_ratio >= 1
			? sim.strings.summary.flowAny
			: fillTemplate(sim.strings.summary.flowCapped, {
					ratio: fmt.ratio(values.max_wallet_two_sided_ratio),
				});
	return fillTemplate(sim.strings.summary.sentence, {
		a: fmt.usd(values.leader_a_min_notional_usdc),
		b: fmt.usd(values.leader_b_min_notional_usdc),
		flowClause,
		liquidity: fmt.usd(values.min_liquidity_usdc),
		horizon: fmt.duration(values.min_seconds_to_resolution),
		staleness: fmt.pct(values.staleness_pct),
		size: fmt.usd(values.trade_size_usdc),
		maxPrice: fmt.price(values.max_entry_price),
		slippage: fmt.pct(values.slippage_pct),
		copies: String(values.max_open_copies_per_leader),
		cap: fmt.usd(values.exposure_cap_usdc),
		floor: fmt.usd(values.working_capital_floor_usdc),
		trim: fmt.fraction(values.trim_close_fraction),
	});
}
