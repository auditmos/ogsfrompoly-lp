/**
 * The copy-trade entry decision, as a pure function.
 *
 * `evaluateSignal` is the whole interface: knob values plus one incoming signal
 * in, an ordered verdict out. The same function runs server-side for the initial
 * SSR paint and again in the browser on every slider move, so the page can never
 * show a verdict the module would not produce.
 *
 * Localization (issue #73) parameterizes the *strings only*: an optional
 * `ClusterSimLocale` bundle carries the catalog-resolved templates and unit
 * words plus the locale whose number conventions format the values. The
 * decision path never reads it — every locale walks the identical checks —
 * and omitting it yields the canonical English verdicts.
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
 * Two pipelines are modelled, and the distinction is load-bearing rather than
 * cosmetic. The crowd threshold belongs to the **tracker**, which simply does not
 * emit an alert below it; every other check belongs to the **executor's** risk
 * gate, judging an alert that already exists. A crowd too small is therefore not
 * a trade the bot refused — it is a trade it was never told about, which is why
 * that outcome is `no-signal` and not `skip`.
 *
 * The real executor short-circuits at the first failing check. Here every check
 * is evaluated so that moving *any* slider gives feedback; the check the real
 * bot would have stopped at is marked `blocker`.
 */

import type { Locale } from "@/i18n/catalog";
import { fillTemplate, formattersFor, type SimFormatters } from "../locale-format";
import { complement, roundTo, snapDown } from "../market-math";
import { SIM_UNITS_EN, type SimUnits } from "../sim-units-en";
import { type KnobKey, type KnobValues, type Scenario, VENUE_FEE_RATE } from "./config";
import { CLUSTER_SIM_EN, type ClusterSimStrings } from "./sim-prose-en";

/**
 * Everything one locale needs to speak the simulator's mind: the locale tag
 * (number conventions), the shared unit templates and the cluster decision
 * strings. Plain data end to end, so the SSR page can hand it to the client
 * script as JSON and both sides recompute the identical strings.
 */
export interface ClusterSimLocale {
	readonly locale: Locale;
	readonly units: SimUnits;
	readonly strings: ClusterSimStrings;
}

const EN_SIM: ClusterSimLocale = { locale: "en", units: SIM_UNITS_EN, strings: CLUSTER_SIM_EN };

// The verdict shapes stay module-private: every consumer (the Astro page, the
// client script, the tests) reads them off `evaluateSignal`'s inferred return
// type, so exporting them would widen the interface for nobody.
type GateId =
	| "crowd"
	| "room"
	| "liquidity"
	| "timing"
	| "freshness"
	| "reversal"
	| "price"
	| "fee"
	| "floor"
	| "fill"
	| "size";

/**
 * Which pipeline enforces a check. `"alert"` is the tracker deciding whether a
 * signal exists at all; `"executor"` is the copy-trade risk gate deciding what
 * to do with one that does. Stated per check so a new one cannot be added
 * without answering the question.
 */
type GateStage = "alert" | "executor";

interface GateResult {
	readonly id: GateId;
	readonly stage: GateStage;
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

/**
 * `"no-signal"` is not a third flavour of refusal. It is the absence of a
 * decision: the alert the executor would have judged was never emitted, so
 * there is no skip card, no log line and no rail to point at.
 */
type VerdictAction = "buy" | "skip" | "no-signal";

interface Verdict {
	readonly action: VerdictAction;
	readonly gates: readonly GateResult[];
	readonly headline: string;
	readonly detail: string;
}

/** Same shape as {@link GateResult} minus the fields the ordering pass fills in. */
type GateCheck = Omit<GateResult, "blocker">;

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

function driftReadout(plan: OrderPlan, sim: ClusterSimLocale, fmt: SimFormatters): string {
	if (plan.adverseMove <= 0) return sim.strings.drift.favour;
	// Under a tenth of a step there is no step count worth printing, and
	// the steps formatter would render the "off" it uses for a disabled floor.
	if (plan.adverseSteps <= 0) return fmt.pct(plan.driftPct);
	return `${fmt.pct(plan.driftPct)} (${fmt.steps(plan.adverseSteps)})`;
}

/** The staleness rail as one readable rule, collapsing when the floor is off. */
function freshnessRule(values: KnobValues, sim: ClusterSimLocale, fmt: SimFormatters): string {
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
 * The entry fee as a share of the ticket. The venue charges per *share* and
 * scales by `p * (1 - p)`, so substituting `shares = size / p` collapses the
 * whole thing to `rate * (1 - p)` — the size cancels out entirely.
 *
 * That is why raising the bet cannot fix a fee problem, and why this rail is a
 * minimum-price gate wearing different units: at a 5% venue rate a 2% ceiling is
 * exactly "never pay under $0.60".
 */
function entryFeeFraction(entryPrice: number): number {
	return VENUE_FEE_RATE * (1 - entryPrice);
}

/** The cheapest outcome a fee ceiling still allows, or `null` when it is off. */
function impliedMinimumPrice(maxEntryFee: number): number | null {
	if (maxEntryFee <= 0 || maxEntryFee >= VENUE_FEE_RATE) return null;
	return roundTo(1 - maxEntryFee / VENUE_FEE_RATE, 4);
}

/**
 * The most a winning ticket can return, which is what the price ceiling is
 * really about: a share bought at `p` pays $1, so the upside is `size * (1-p)/p`
 * against a downside of the whole ticket. At $0.95 that is 19:1 against; at
 * $0.998 it is 500:1, and a single adverse resolution erases hundreds of wins.
 */
function maxGain(values: KnobValues, plan: OrderPlan): number {
	if (plan.entryPrice <= 0) return 0;
	return (values.trade_size_usdc * (1 - plan.entryPrice)) / plan.entryPrice;
}

/**
 * Did the same wallets sit on the opposite side of this market inside the
 * window? `null` evidence stands the rail down — nobody flipped is a measurement,
 * but an unmeasured lookback is not, and the executor refuses to guess either way.
 *
 * Two arms, either sufficient, exactly as the executor enforces them:
 *
 * - **too many flipped** — more than `max_reversed_wallets`. At the live `0`
 *   that is the strict reading: one flipper refuses the crowd.
 * - **not enough left** — drop the flippers and fewer than `cluster_threshold`
 *   clean wallets remain, i.e. the flip was carrying the crowd. This catches a
 *   crowd the count arm lets through once the tolerance is raised.
 */
function hasJustFlipped(values: KnobValues, signal: Scenario): boolean {
	const flip = signal.crowdFlip;
	if (values.reversal_lookback_s <= 0 || flip === null) return false;
	if (flip.secondsAgo > values.reversal_lookback_s) return false;
	const clean = signal.smartWallets - flip.wallets;
	return flip.wallets > values.max_reversed_wallets || clean < values.cluster_threshold;
}

/** Which of the two arms refused, said in one sentence. */
function reversalBecause(
	values: KnobValues,
	signal: Scenario,
	sim: ClusterSimLocale,
	fmt: SimFormatters,
): string {
	const flip = signal.crowdFlip;
	if (flip === null) return "";
	const reversal = sim.strings.gates.reversal;
	const when = fillTemplate(reversal.when, {
		ago: fmt.duration(flip.secondsAgo),
		window: fmt.duration(values.reversal_lookback_s),
	});
	if (flip.wallets > values.max_reversed_wallets) {
		return fillTemplate(fmt.pluralize(reversal.becauseTooMany, flip.wallets), { when });
	}
	const clean = signal.smartWallets - flip.wallets;
	return fillTemplate(reversal.becauseTooFew, {
		flipped: String(flip.wallets),
		when,
		clean: fmt.skilledWallets(clean),
		threshold: String(values.cluster_threshold),
	});
}

/**
 * Order matters from the second entry on: that is the order the executor asks
 * its own questions in, ending with the two the venue asks for it. The first
 * entry is not part of that sequence at all — it is the tracker's own bar for
 * raising an alert, and it is listed here so its slider can move the two rails
 * downstream that read the same number as a survivor count.
 *
 * Between the two stages the executor runs seven further terminal checks this
 * page deliberately omits: unconfigured category, missing cluster id, a position
 * already open, re-entry into a crowd it has closed, the kill switch, a missing
 * token id, and no opposite outcome to mirror onto. Each is bookkeeping rather
 * than risk and none is a knob, so listing them would bury the ones that are.
 */
function checks(
	values: KnobValues,
	signal: Scenario,
	plan: OrderPlan,
	sim: ClusterSimLocale,
	fmt: SimFormatters,
): GateCheck[] {
	const wouldOpen = signal.openExposureUsdc + values.trade_size_usdc;
	const wouldLeave = signal.balanceUsdc - values.trade_size_usdc;
	const ranAway = hasRunAway(values, plan);
	const gates = sim.strings.gates;
	const size = fmt.usd(values.trade_size_usdc);

	return [
		{
			id: "crowd",
			stage: "alert",
			question: gates.crowd.question,
			knob: "cluster_threshold",
			actual: fmt.wallets(signal.smartWallets),
			rule: `≥ ${values.cluster_threshold}`,
			passed: signal.smartWallets >= values.cluster_threshold,
			because: fillTemplate(gates.crowd.because, {
				wallets: fmt.skilledWallets(signal.smartWallets),
				threshold: String(values.cluster_threshold),
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
			passed: !ranAway,
			because: fillTemplate(gates.freshness.because, {
				drift: fmt.pct(plan.driftPct),
				entry: fmt.price(plan.entryPrice),
				live: fmt.price(plan.livePrice),
				limit: fmt.pct(values.staleness_pct),
				floor: fmt.steps(values.staleness_min_ticks),
			}),
		},
		{
			id: "reversal",
			stage: "executor",
			question: gates.reversal.question,
			knob: "reversal_lookback_s",
			actual:
				signal.crowdFlip === null
					? gates.reversal.actualNone
					: fillTemplate(gates.reversal.actualSome, {
							flipped: String(signal.crowdFlip.wallets),
							total: String(signal.smartWallets),
							ago: fmt.duration(signal.crowdFlip.secondsAgo),
						}),
			rule:
				values.reversal_lookback_s <= 0
					? sim.units.off
					: fillTemplate(gates.reversal.rule, {
							tolerated: String(values.max_reversed_wallets),
							window: fmt.duration(values.reversal_lookback_s),
						}),
			passed: !hasJustFlipped(values, signal),
			because: reversalBecause(values, signal, sim, fmt),
		},
		{
			id: "price",
			stage: "executor",
			question: gates.price.question,
			knob: "max_entry_price",
			actual: fmt.price(plan.entryPrice),
			rule: values.max_entry_price <= 0 ? sim.units.off : `≤ ${fmt.price(values.max_entry_price)}`,
			passed: values.max_entry_price <= 0 || plan.entryPrice <= values.max_entry_price,
			because: fillTemplate(gates.price.because, {
				entry: fmt.price(plan.entryPrice),
				ceiling: fmt.price(values.max_entry_price),
				gain: fmt.usd(maxGain(values, plan)),
				size,
			}),
		},
		{
			id: "fee",
			stage: "executor",
			question: gates.fee.question,
			knob: "max_entry_fee_pct",
			actual: fmt.fraction(entryFeeFraction(plan.entryPrice)),
			rule:
				values.max_entry_fee_pct <= 0
					? sim.units.off
					: `≤ ${fmt.fraction(values.max_entry_fee_pct)}`,
			passed:
				values.max_entry_fee_pct <= 0 ||
				entryFeeFraction(plan.entryPrice) <= values.max_entry_fee_pct,
			because: fillTemplate(gates.fee.because, {
				entry: fmt.price(plan.entryPrice),
				fraction: fmt.fraction(entryFeeFraction(plan.entryPrice)),
				ceiling: fmt.fraction(values.max_entry_fee_pct),
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
		{
			id: "fill",
			stage: "executor",
			question: gates.fill.question,
			knob: "slippage_pct",
			actual: fillTemplate(gates.fill.actual, { price: fmt.price(plan.livePrice) }),
			rule: `≤ ${fmt.price(plan.limitPrice)}`,
			passed: plan.livePrice <= plan.limitPrice,
			because: fillTemplate(gates.fill.because, {
				ask: fmt.price(plan.livePrice),
				limit: fmt.price(plan.limitPrice),
			}),
		},
		{
			id: "size",
			stage: "executor",
			question: gates.size.question,
			knob: "trade_size_usdc",
			actual: fmt.shares(plan.shares),
			rule: `≥ ${fmt.shares(signal.minShares)}`,
			passed: plan.shares >= signal.minShares,
			because: fillTemplate(gates.size.because, {
				size,
				limit: fmt.price(plan.limitPrice),
				shares: fmt.shares(plan.shares),
				min: fmt.shares(signal.minShares),
			}),
		},
	];
}

function buyDetail(
	values: KnobValues,
	plan: OrderPlan,
	sim: ClusterSimLocale,
	fmt: SimFormatters,
): string {
	const order = fillTemplate(sim.strings.detail.order, {
		size: fmt.usd(values.trade_size_usdc),
		limit: fmt.price(plan.limitPrice),
		shares: fmt.shares(plan.shares),
	});
	if (plan.mirrored) {
		return fillTemplate(sim.strings.detail.buyMirror, {
			entry: fmt.price(plan.entryPrice),
			order,
		});
	}
	return fillTemplate(sim.strings.detail.buy, { order });
}

export function evaluateSignal(
	values: KnobValues,
	signal: Scenario,
	sim: ClusterSimLocale = EN_SIM,
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
			action: "buy",
			gates,
			headline: fillTemplate(sim.strings.verdict.buy, {
				size: fmt.usd(values.trade_size_usdc),
			}),
			detail: buyDetail(values, plan, sim, fmt),
		};
	}

	// A failure upstream of the executor is not a refusal it made. The alert never
	// existed, so there is nothing for it to have refused.
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
 * A sale carries the translation with it — the price the bot would pay is on the
 * *other* outcome, and nothing else on the page makes sense without that. The
 * invented market titles are quoted as-is in every locale, the way a real
 * (English-titled) Polymarket market would be.
 */
export function signalLine(
	signal: Scenario,
	sim: ClusterSimLocale = EN_SIM,
): {
	lead: string;
	market: string;
	trail: string;
} {
	const fmt = formattersFor(sim.locale, sim.units);
	const wallets = fmt.skilledWallets(signal.smartWallets);
	const sold = signal.crowdSide === "sold";
	const lead = fillTemplate(sold ? sim.strings.signal.leadSold : sim.strings.signal.leadBought, {
		wallets,
	});
	const trail = sold
		? fillTemplate(sim.strings.signal.trailSold, {
				price: fmt.price(signal.crowdPrice),
				mirror: fmt.price(complement(signal.crowdPrice)),
			})
		: fillTemplate(sim.strings.signal.trailBought, { price: fmt.price(signal.crowdPrice) });
	return { lead, market: signal.market, trail };
}

/**
 * The "in one sentence" summary, rewritten from whatever the knobs currently say.
 */
export function summarySentence(values: KnobValues, sim: ClusterSimLocale = EN_SIM): string {
	const fmt = formattersFor(sim.locale, sim.units);
	const floor = impliedMinimumPrice(values.max_entry_fee_pct);
	const priceBand =
		floor === null
			? fillTemplate(sim.strings.summary.priceCapOnly, {
					max: fmt.price(values.max_entry_price),
				})
			: fillTemplate(sim.strings.summary.priceBand, {
					min: fmt.price(floor),
					max: fmt.price(values.max_entry_price),
				});
	return fillTemplate(sim.strings.summary.sentence, {
		threshold: String(values.cluster_threshold),
		lookback: fmt.duration(values.reversal_lookback_s),
		liquidity: fmt.usd(values.min_liquidity_usdc),
		horizon: fmt.duration(values.min_seconds_to_resolution),
		staleness: fmt.pct(values.staleness_pct),
		size: fmt.usd(values.trade_size_usdc),
		priceBand,
		fee: fmt.fraction(values.max_entry_fee_pct),
		slippage: fmt.pct(values.slippage_pct),
		floor: fmt.usd(values.working_capital_floor_usdc),
		gas: String(values.gas_reserve_pol),
		cap: fmt.usd(values.exposure_cap_usdc),
	});
}
