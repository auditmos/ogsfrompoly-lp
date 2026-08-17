/**
 * The auto-close rail, mirrored for the walkthroughs (issue #77, PRD
 * auditmos/ogsfrompoly#361 phase 5).
 *
 * Assumptions this suite encodes, stated before the first RED:
 *
 * *Input.* A close plan carrying the three figures the upstream evaluator
 * reads — `realizedPnlUsdc`, `costUsdc`, `entryFeeUsdc` — so this module never
 * re-derives fee math either. Thresholds are whole percents (`30` = 30 %);
 * `0` disables that side. The streak is caller-held per-position state.
 *
 * *Output.* A decision whose non-`none` words are the raw ledger reasons
 * (`stop_loss` / `take_profit`), plus the new streak and the measured percent.
 *
 * *Boundaries.* A reading exactly at a threshold counts as breached; the
 * two-consecutive-tick debounce is symmetric; a non-positive basis can never
 * fire.
 *
 * *Not tested here.* The venue fee curve, the reader-facing bid paths, and the
 * page prose — each has its own boundary.
 */

import { resolveAutoCloseSim, resolveSimUnits } from "@/i18n/catalog";
import {
	AUTO_CLOSE_SCENARIOS,
	type AutoCloseDecision,
	type AutoCloseScenario,
	type AutoCloseThresholds,
	autoCloseReadings,
	type ClosePlan,
	describeAutoClose,
	evaluateAutoClose,
	FRESH_STREAK,
	netRealizablePct,
	planAtBid,
	runAutoClosePath,
} from "./auto-close";
import fixturesJson from "./auto-close-fixtures.json";
import { AUTO_CLOSE_SIM_EN } from "./auto-close-prose-en";

interface FixtureTick {
	tick: number;
	quotable: boolean;
	netPct: number | null;
	decision: AutoCloseDecision;
	streakTicks: number;
}

interface FixtureCase {
	id: string;
	note: string;
	thresholds: AutoCloseThresholds;
	readings: (ClosePlan | null)[];
	expected: {
		ticks: FixtureTick[];
		closeTick: number | null;
		decision: AutoCloseDecision;
		netPct: number | null;
	};
}

const FIXTURES = fixturesJson as {
	version: number;
	source: string;
	generator: string;
	cases: FixtureCase[];
};

/**
 * Float equality across a language boundary. Both sides do the same three
 * arithmetic operations on IEEE doubles, so they agree far past this — 10
 * decimals leaves room for JSON round-tripping without letting a genuine
 * semantic drift hide.
 */
function expectPctEqual(actual: number | null, expected: number | null): void {
	if (expected === null) {
		expect(actual).toBeNull();
		return;
	}
	expect(actual).not.toBeNull();
	expect(actual as number).toBeCloseTo(expected, 10);
}

/** A plan whose net-realizable percent is exactly `pct`. */
function planAt(
	pct: number,
	basis = 100,
): { realizedPnlUsdc: number; costUsdc: number; entryFeeUsdc: number } {
	return { realizedPnlUsdc: (basis * pct) / 100, costUsdc: basis, entryFeeUsdc: 0 };
}

describe("evaluateAutoClose", () => {
	it("fires a stop-loss on the second consecutive breached tick", () => {
		const thresholds = { lossPct: 25, profitPct: 0 };

		const first = evaluateAutoClose(planAt(-30), { thresholds });
		expect(first.decision).toBe("none");

		const second = evaluateAutoClose(planAt(-31), { thresholds, streak: first.streak });
		expect(second.decision).toBe("stop_loss");
		expect(second.netPct).toBeCloseTo(-31, 10);
	});

	it("fires a take-profit on the second consecutive breached tick", () => {
		const thresholds = { lossPct: 0, profitPct: 40 };

		const first = evaluateAutoClose(planAt(45), { thresholds });
		const second = evaluateAutoClose(planAt(52), { thresholds, streak: first.streak });

		expect(first.decision).toBe("none");
		expect(second.decision).toBe("take_profit");
	});

	// The operator armed "close at 30%", not "close past 30%".
	it.each([
		[{ lossPct: 30, profitPct: 0 }, -30, "stop_loss"],
		[{ lossPct: 0, profitPct: 30 }, 30, "take_profit"],
	] as const)("counts a reading exactly at the threshold as breached (%o)", (thresholds, pct, decision) => {
		const first = evaluateAutoClose(planAt(pct), { thresholds });
		const second = evaluateAutoClose(planAt(pct), { thresholds, streak: first.streak });

		expect(second.decision).toBe(decision);
	});

	it("resets the streak when the reading recovers between breaches", () => {
		const thresholds = { lossPct: 25, profitPct: 0 };

		const first = evaluateAutoClose(planAt(-30), { thresholds });
		const recovered = evaluateAutoClose(planAt(-10), { thresholds, streak: first.streak });
		const third = evaluateAutoClose(planAt(-30), { thresholds, streak: recovered.streak });

		expect(recovered.decision).toBe("none");
		expect(recovered.streak).toEqual(FRESH_STREAK);
		expect(third.decision).toBe("none");
	});

	it("restarts the streak when the breach flips direction", () => {
		const thresholds = { lossPct: 25, profitPct: 25 };

		const loss = evaluateAutoClose(planAt(-30), { thresholds });
		const profit = evaluateAutoClose(planAt(30), { thresholds, streak: loss.streak });

		expect(profit.decision).toBe("none");
		expect(profit.streak).toEqual({ direction: "take_profit", ticks: 1 });
	});

	it.each([
		[{ lossPct: 0, profitPct: 30 }, -80, "never stops a loss"],
		[{ lossPct: 30, profitPct: 0 }, 80, "never takes a profit"],
	] as const)("a threshold of 0 stands that side down: %o %s", (thresholds, pct, _note) => {
		let streak = FRESH_STREAK;
		for (let tick = 0; tick < 5; tick++) {
			const evaluation = evaluateAutoClose(planAt(pct), { thresholds, streak });
			expect(evaluation.decision).toBe("none");
			streak = evaluation.streak;
		}
	});

	it("can never fire with both sides disabled", () => {
		const thresholds = { lossPct: 0, profitPct: 0 };
		let streak = FRESH_STREAK;

		for (const pct of [-99, -50, 0, 50, 500]) {
			const evaluation = evaluateAutoClose(planAt(pct), { thresholds, streak });
			expect(evaluation.decision).toBe("none");
			streak = evaluation.streak;
		}
	});
});

describe("runAutoClosePath", () => {
	it("reports the tick a losing path closes on and the percent it closed at", () => {
		const path = runAutoClosePath([planAt(-10), planAt(-30), planAt(-31), planAt(-40)], {
			lossPct: 25,
			profitPct: 0,
		});

		expect(path.decision).toBe("stop_loss");
		expect(path.closeTick).toBe(3);
		expect(path.netPct).toBeCloseTo(-31, 10);
	});

	it("stops reading once the position is closed", () => {
		const path = runAutoClosePath([planAt(-30), planAt(-31), planAt(-40)], {
			lossPct: 25,
			profitPct: 0,
		});

		expect(path.closeTick).toBe(2);
		expect(path.ticks).toHaveLength(2);
	});

	it("rides an unbreached path to the end without closing", () => {
		const path = runAutoClosePath([planAt(-10), planAt(5), planAt(12)], {
			lossPct: 25,
			profitPct: 40,
		});

		expect(path.decision).toBe("none");
		expect(path.closeTick).toBeNull();
		expect(path.ticks).toHaveLength(3);
	});

	// An unreadable book is not a reading: the rail skips the position for that
	// tick and resets its streak, so a breach either side of it is not a streak.
	it("treats an unquotable tick as a skip that resets the streak", () => {
		const path = runAutoClosePath([planAt(-30), null, planAt(-30)], {
			lossPct: 25,
			profitPct: 0,
		});

		expect(path.closeTick).toBeNull();
		expect(path.ticks[1]).toMatchObject({ quotable: false, decision: "none" });
	});

	it("closes an already-breached position by the second tick", () => {
		const path = runAutoClosePath([planAt(-60), planAt(-60)], { lossPct: 25, profitPct: 0 });

		expect(path.closeTick).toBe(2);
		expect(path.decision).toBe("stop_loss");
	});

	it("numbers ticks from one and carries each reading's percent", () => {
		const path = runAutoClosePath([planAt(-10), null, planAt(12)], { lossPct: 25, profitPct: 0 });

		expect(path.ticks.map((tick) => tick.tick)).toEqual([1, 2, 3]);
		expect(path.ticks[0]?.netPct).toBeCloseTo(-10, 10);
		expect(path.ticks[1]?.netPct).toBeNull();
		expect(path.ticks[2]?.netPct).toBeCloseTo(12, 10);
	});
});

/**
 * The pin against the running system. `auto-close-fixtures.json` is generated
 * by the upstream evaluator itself (`uv run
 * scripts/export_auto_close_fixtures.py` in auditmos/ogsfrompoly), so a
 * semantic drift between the rail the bots run and the rail this page draws
 * fails here rather than reaching a reader.
 */
describe("shared-evaluator parity", () => {
	it("reads the fixture set it was written against", () => {
		expect(FIXTURES.version).toBe(1);
		expect(FIXTURES.source).toBe("poly_track.copy_trade.auto_close.evaluate_auto_close");
		expect(FIXTURES.cases.length).toBeGreaterThan(0);
	});

	it.each(
		FIXTURES.cases.map((testCase) => [testCase.id, testCase] as const),
	)("agrees with the evaluator on %s", (_id, testCase) => {
		const path = runAutoClosePath(testCase.readings, testCase.thresholds);

		expect(path.closeTick).toBe(testCase.expected.closeTick);
		expect(path.decision).toBe(testCase.expected.decision);
		expectPctEqual(path.netPct, testCase.expected.netPct);

		expect(path.ticks).toHaveLength(testCase.expected.ticks.length);
		for (const [index, expected] of testCase.expected.ticks.entries()) {
			const actual = path.ticks[index];
			expect(actual).toBeDefined();
			expect(actual?.tick).toBe(expected.tick);
			expect(actual?.quotable).toBe(expected.quotable);
			expect(actual?.decision).toBe(expected.decision);
			expect(actual?.streakTicks).toBe(expected.streakTicks);
			expectPctEqual(actual?.netPct ?? null, expected.netPct);
		}
	});

	it("covers both directions, both disablements and a fee-priced path", () => {
		// A fixture file that silently lost its interesting cases would still
		// pass every case above. Name the semantics the page depends on.
		const ids = new Set(FIXTURES.cases.map((testCase) => testCase.id));
		for (const required of [
			"stop-loss-two-ticks",
			"take-profit-two-ticks",
			"loss-boundary-exact",
			"profit-boundary-exact",
			"recovery-breaks-streak",
			"unquotable-breaks-streak",
			"already-breached-at-start",
			"both-sides-disarmed",
			"fee-inclusive-drift",
			"fee-inclusive-run-up",
		]) {
			expect(ids).toContain(required);
		}
	});
});

describe("planAtBid", () => {
	// The strongest statement this module can make about its own arithmetic:
	// priced from the same book, it reproduces the plan the upstream evaluator
	// was handed — venue fee curve, truncation and all.
	it("reproduces the fee-inclusive fixture readings from the book alone", () => {
		const drift = FIXTURES.cases.find((testCase) => testCase.id === "fee-inclusive-drift");
		expect(drift).toBeDefined();

		const bids = [0.38, 0.3, 0.28];
		for (const [index, bid] of bids.entries()) {
			const plan = planAtBid({ shares: 12.5, entryPrice: 0.4, bid });
			const expected = drift?.readings[index];
			expect(expected).not.toBeNull();
			expect(plan.costUsdc).toBeCloseTo(expected?.costUsdc as number, 10);
			expect(plan.entryFeeUsdc).toBeCloseTo(expected?.entryFeeUsdc as number, 10);
			expect(plan.realizedPnlUsdc).toBeCloseTo(expected?.realizedPnlUsdc as number, 10);
		}
	});

	it("charges the fee off both ends of the round trip", () => {
		// Sold back at exactly what it cost, the position is down both fees.
		const plan = planAtBid({ shares: 12.5, entryPrice: 0.4, bid: 0.4 });

		expect(plan.realizedPnlUsdc).toBeCloseTo(-0.3, 10);
		expect(netRealizablePct(plan)).toBeLessThan(0);
	});
});

describe("AUTO_CLOSE_SCENARIOS", () => {
	it("gives every path a unique id for the panel's button state", () => {
		expect(new Set(AUTO_CLOSE_SCENARIOS.map((path) => path.id)).size).toBe(
			AUTO_CLOSE_SCENARIOS.length,
		);
	});

	it("carries a path with an unreadable book, so the skip rule is reachable", () => {
		const withGap = AUTO_CLOSE_SCENARIOS.filter((path) => path.bids.some((bid) => bid === null));
		expect(withGap.length).toBeGreaterThan(0);
	});

	it("prices every tick of every path against the venue's own curve", () => {
		for (const path of AUTO_CLOSE_SCENARIOS) {
			const readings = autoCloseReadings(path);
			expect(readings).toHaveLength(path.bids.length);
			for (const [index, reading] of readings.entries()) {
				expect(reading === null).toBe(path.bids[index] === null);
			}
		}
	});

	// The acceptance criterion a reader checks by hand: arm both sides, and a
	// losing path stops out while a winning one takes profit.
	it("closes the losing path at the stop and the winning path at the take-profit", () => {
		const thresholds = { lossPct: 25, profitPct: 40 };
		const losing = AUTO_CLOSE_SCENARIOS.find((path) => path.id === "drifts-down");
		const winning = AUTO_CLOSE_SCENARIOS.find((path) => path.id === "runs-up");
		expect(losing).toBeDefined();
		expect(winning).toBeDefined();

		const stopped = runAutoClosePath(autoCloseReadings(losing as AutoCloseScenario), thresholds);
		const took = runAutoClosePath(autoCloseReadings(winning as AutoCloseScenario), thresholds);

		expect(stopped.decision).toBe("stop_loss");
		expect(stopped.closeTick).not.toBeNull();
		expect(took.decision).toBe("take_profit");
		expect(took.closeTick).not.toBeNull();
	});

	it("holds every path while the rail is disarmed, which is the shipped config", () => {
		for (const path of AUTO_CLOSE_SCENARIOS) {
			const result = runAutoClosePath(autoCloseReadings(path), { lossPct: 0, profitPct: 0 });
			expect(result.decision).toBe("none");
			expect(result.closeTick).toBeNull();
		}
	});
});

describe("describeAutoClose", () => {
	const DRIFTS_DOWN = AUTO_CLOSE_SCENARIOS[0];
	const RUNS_UP = AUTO_CLOSE_SCENARIOS[1];
	const WHIPSAW = AUTO_CLOSE_SCENARIOS[2];
	const BOOK_GAP = AUTO_CLOSE_SCENARIOS[3];

	it("says the rail is disarmed when the live config is what it reads", () => {
		const view = describeAutoClose({ lossPct: 0, profitPct: 0 }, DRIFTS_DOWN);

		expect(view.action).toBe("disarmed");
		expect(view.rows.every((row) => !row.closed)).toBe(true);
	});

	it("prints a row per tick, and stops printing at the close", () => {
		const view = describeAutoClose({ lossPct: 25, profitPct: 0 }, DRIFTS_DOWN);

		expect(view.action).toBe("stop_loss");
		expect(view.rows).toHaveLength(4);
		expect(view.rows.at(-1)?.closed).toBe(true);
	});

	it("takes profit on the winning path", () => {
		expect(describeAutoClose({ lossPct: 0, profitPct: 40 }, RUNS_UP).action).toBe("take_profit");
	});

	it("holds a path that crosses the line once and comes back", () => {
		const view = describeAutoClose({ lossPct: 25, profitPct: 0 }, WHIPSAW);

		expect(view.action).toBe("held");
		expect(view.rows.some((row) => row.state === AUTO_CLOSE_SIM_EN.stateArmed)).toBe(true);
	});

	it("marks an unreadable book as a skip rather than as a reading", () => {
		const view = describeAutoClose({ lossPct: 25, profitPct: 0 }, BOOK_GAP);

		const gap = view.rows[1];
		expect(gap?.quotable).toBe(false);
		expect(gap?.state).toBe(AUTO_CLOSE_SIM_EN.stateNoBid);
		expect(view.action).toBe("held");
		// Not the "off" word: a rail standing down and a book with nothing on it
		// are different facts, and the reading column is where the second one shows.
		expect(gap?.reading).toBe("—");
		expect(gap?.reading).not.toBe(AUTO_CLOSE_SIM_EN.stateNoBid);
	});

	it("names the position the reader is watching, fees and all", () => {
		const view = describeAutoClose({ lossPct: 25, profitPct: 0 }, DRIFTS_DOWN);

		expect(view.position).toContain("$5");
		expect(view.position).toContain("$0.4");
		expect(view.position).toContain("12.5 shares");
	});

	// The decision path never reads the locale bundle — every locale walks the
	// identical checks, and only the words around the numbers change.
	it.each([["pl"], ["es"]] as const)("decides identically in %s", (locale) => {
		const sim = {
			locale,
			units: resolveSimUnits(locale),
			strings: resolveAutoCloseSim(locale),
		};
		const thresholds = { lossPct: 25, profitPct: 40 };

		for (const scenario of AUTO_CLOSE_SCENARIOS) {
			const localized = describeAutoClose(thresholds, scenario, sim);
			const english = describeAutoClose(thresholds, scenario);

			expect(localized.action).toBe(english.action);
			expect(localized.rows).toHaveLength(english.rows.length);
			expect(localized.rows.map((row) => row.closed)).toEqual(
				english.rows.map((row) => row.closed),
			);
		}
	});

	it.each([["pl"], ["es"]] as const)("speaks %s rather than falling back to English", (locale) => {
		const sim = {
			locale,
			units: resolveSimUnits(locale),
			strings: resolveAutoCloseSim(locale),
		};

		const localized = describeAutoClose(
			{ lossPct: 25, profitPct: 0 },
			AUTO_CLOSE_SCENARIOS[0],
			sim,
		);
		const english = describeAutoClose({ lossPct: 25, profitPct: 0 }, AUTO_CLOSE_SCENARIOS[0]);

		expect(localized.headline).not.toBe(english.headline);
		expect(localized.detail).not.toBe(english.detail);
	});
});

describe("netRealizablePct", () => {
	it("measures the realized figure against the basis including the entry fee", () => {
		// $1.20 back on a $5 ticket that cost $0.05 to enter.
		expect(netRealizablePct({ realizedPnlUsdc: 1.2, costUsdc: 5, entryFeeUsdc: 0.05 })).toBeCloseTo(
			23.762376,
			6,
		);
	});

	it("reads a non-positive basis as 0% rather than dividing by it", () => {
		expect(netRealizablePct({ realizedPnlUsdc: -3, costUsdc: 0, entryFeeUsdc: 0 })).toBe(0);
		expect(netRealizablePct({ realizedPnlUsdc: 4, costUsdc: -2, entryFeeUsdc: 1 })).toBe(0);
	});
});
