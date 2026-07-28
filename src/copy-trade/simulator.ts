/**
 * The copy-trade entry decision, as a pure function.
 *
 * `evaluateSignal` is the whole interface: knob values plus one incoming signal
 * in, an ordered verdict out. The same function runs server-side for the initial
 * SSR paint and again in the browser on every slider move, so the page can never
 * show a verdict the module would not produce.
 *
 * The real executor short-circuits at the first failing check. Here every check
 * is evaluated so that moving *any* slider gives feedback; the check the real
 * bot would have stopped at is marked `blocker`.
 */

import {
	formatDuration,
	formatPct,
	formatUsd,
	type KnobKey,
	type KnobValues,
	type Scenario,
} from "./config";

// The verdict shapes stay module-private: every consumer (the Astro page, the
// client script, the tests) reads them off `evaluateSignal`'s inferred return
// type, so exporting them would widen the interface for nobody.
type GateId = "crowd" | "liquidity" | "timing" | "freshness" | "room" | "floor" | "price";

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

/** Order matters: it is the order the executor asks the questions in. */
function checks(values: KnobValues, signal: Scenario): GateCheck[] {
	const wouldOpen = signal.openExposureUsdc + values.trade_size_usdc;
	const wouldLeave = signal.balanceUsdc - values.trade_size_usdc;

	return [
		{
			id: "crowd",
			question: "Is a crowd agreeing, not just one trader?",
			knob: "cluster_threshold",
			actual: `${signal.smartWallets} ${signal.smartWallets === 1 ? "wallet" : "wallets"}`,
			rule: `≥ ${values.cluster_threshold}`,
			passed: signal.smartWallets >= values.cluster_threshold,
			because: `Only ${signal.smartWallets} skilled ${signal.smartWallets === 1 ? "wallet" : "wallets"} bought in; the bot waits for ${values.cluster_threshold}.`,
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
			actual: formatPct(signal.priceDriftPct),
			rule: `≤ ${formatPct(values.staleness_pct)}`,
			passed: signal.priceDriftPct <= values.staleness_pct,
			because: `The price moved ${formatPct(signal.priceDriftPct)} since the crowd bought, past the ${formatPct(values.staleness_pct)} staleness limit — the move already happened.`,
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
			id: "floor",
			question: "Will this take me below my floor?",
			knob: "working_capital_floor_usdc",
			actual: `${formatUsd(signal.balanceUsdc)} → ${formatUsd(wouldLeave)}`,
			rule: `≥ ${formatUsd(values.working_capital_floor_usdc)}`,
			passed: wouldLeave >= values.working_capital_floor_usdc,
			because: `A ${formatUsd(values.trade_size_usdc)} ticket would leave ${formatUsd(wouldLeave)}, under the ${formatUsd(values.working_capital_floor_usdc)} working-capital floor.`,
		},
		{
			id: "price",
			question: "Am I being asked to overpay?",
			knob: "slippage_pct",
			actual: formatPct(signal.quotedSlippagePct),
			rule: `≤ ${formatPct(values.slippage_pct)}`,
			passed: signal.quotedSlippagePct <= values.slippage_pct,
			because: `The book wants ${formatPct(signal.quotedSlippagePct)} over fair price, past the ${formatPct(values.slippage_pct)} brake — the bot walks rather than chase.`,
		},
	];
}

export function evaluateSignal(values: KnobValues, signal: Scenario): Verdict {
	const raw = checks(values, signal);
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
			detail: `All seven checks passed. The bot takes a ${formatUsd(values.trade_size_usdc)} ticket at market and holds it until the first skilled wallet sells.`,
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
 * The "in one sentence" summary, rewritten from whatever the knobs currently say.
 */
export function summarySentence(values: KnobValues): string {
	return [
		`When ${values.cluster_threshold}+ skilled wallets agree,`,
		`and the market holds at least ${formatUsd(values.min_liquidity_usdc)} of liquidity,`,
		`has more than ${formatDuration(values.min_seconds_to_resolution)} left to run,`,
		`and has not moved more than ${formatPct(values.staleness_pct)} since they bought`,
		`→ the bot buys ${formatUsd(values.trade_size_usdc)} without paying more than`,
		`${formatPct(values.slippage_pct)} over fair price, holds until the first of them sells,`,
		`keeps ${values.gas_reserve_pol} POL back for gas and ${formatUsd(values.working_capital_floor_usdc)} on the floor,`,
		`and repeats with never more than ${formatUsd(values.exposure_cap_usdc)} in play at once.`,
	].join(" ");
}
