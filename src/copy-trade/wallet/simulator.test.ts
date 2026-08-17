import { resolveSimUnits, resolveWalletSim } from "@/i18n/catalog";
import {
	isWalletKnobKey,
	WALLET_LIVE_CONFIG,
	WALLET_SCENARIOS,
	type WalletKnobValues,
	type WalletScenario,
} from "./config";
import {
	evaluateLeaderSignal,
	evaluateTrim,
	leaderSignalLine,
	walletSummarySentence,
} from "./simulator";

// Destructuring the tuple keeps each fixture exactly typed — no array-access guard.
const [
	textbook,
	smallPoke,
	leaderBBar,
	cheapSide,
	twoSided,
	emptyWindow,
	spree,
	full,
	chased,
	tooDear,
	endsSoon,
	thin,
	broke,
] = WALLET_SCENARIOS;

function withKnobs(overrides: Partial<WalletKnobValues>): WalletKnobValues {
	return { ...WALLET_LIVE_CONFIG, ...overrides };
}

/**
 * Boot first, the tracker's bar second, then the executor's own order of
 * questions — per-leader cap before the shared risk gate, exactly as the real
 * engine asks them.
 */
const GATE_ORDER = [
	"boot",
	"conviction",
	"cap",
	"room",
	"liquidity",
	"timing",
	"freshness",
	"flow",
	"price",
	"floor",
];

function gate(values: WalletKnobValues, scenario: WalletScenario, id: string) {
	return evaluateLeaderSignal(values, scenario).gates.find((entry) => entry.id === id);
}

describe("evaluateLeaderSignal", () => {
	it("copies the textbook signal on the live config", () => {
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, textbook);

		expect(verdict.action).toBe("copy");
		expect(verdict.headline).toBe("COPY $5");
		expect(verdict.gates.every((entry) => entry.passed)).toBe(true);
		expect(verdict.gates.some((entry) => entry.blocker)).toBe(false);
	});

	it("asks every question in pipeline order, whatever the outcome", () => {
		for (const scenario of WALLET_SCENARIOS) {
			const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, scenario);
			expect(verdict.gates.map((entry) => entry.id)).toEqual(GATE_ORDER);
		}
	});

	it("names the pipeline that enforces each check", () => {
		// The 5-share minimum is the service's own boot check, and the conviction
		// bar is the tracker's — everything after them is a rail the risk gate
		// really runs.
		const stages = evaluateLeaderSignal(WALLET_LIVE_CONFIG, textbook).gates.map((entry) => [
			entry.id,
			entry.stage,
		]);

		expect(stages[0]).toEqual(["boot", "boot"]);
		expect(stages[1]).toEqual(["conviction", "alert"]);
		expect(stages.slice(2).every(([, stage]) => stage === "executor")).toBe(true);
	});

	it("points every check at a knob the panel actually ships", () => {
		for (const entry of evaluateLeaderSignal(WALLET_LIVE_CONFIG, textbook).gates) {
			expect(isWalletKnobKey(entry.knob)).toBe(true);
		}
	});

	it.each([
		{ scenario: twoSided, blocker: "flow" },
		{ scenario: spree, blocker: "cap" },
		{ scenario: full, blocker: "room" },
		{ scenario: chased, blocker: "freshness" },
		{ scenario: tooDear, blocker: "price" },
		{ scenario: endsSoon, blocker: "timing" },
		{ scenario: thin, blocker: "liquidity" },
		{ scenario: broke, blocker: "floor" },
	])("skips $scenario.label on the check it was written to trip", ({ scenario, blocker }) => {
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, scenario);

		expect(verdict.action).toBe("skip");
		expect(verdict.headline).toBe("SKIP");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe(blocker);
	});

	it.each([
		{ scenario: leaderBBar },
		{ scenario: cheapSide },
		{ scenario: emptyWindow },
	])("copies $scenario.label on the live config", ({ scenario }) => {
		expect(evaluateLeaderSignal(WALLET_LIVE_CONFIG, scenario).action).toBe("copy");
	});

	it("marks only the first failing check as the blocker", () => {
		// The spree scenario fails only the cap, but a knob change can stack
		// failures; only the first may be flagged, like the real short-circuit.
		const strict = withKnobs({ min_liquidity_usdc: 10000, working_capital_floor_usdc: 50 });
		const verdict = evaluateLeaderSignal(strict, textbook);
		const failed = verdict.gates.filter((entry) => !entry.passed).map((entry) => entry.id);

		expect(failed).toEqual(["liquidity", "floor"]);
		expect(verdict.gates.filter((entry) => entry.blocker).map((entry) => entry.id)).toEqual([
			"liquidity",
		]);
	});

	it("explains the skip with the blocking check's reason", () => {
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, endsSoon);

		expect(verdict.detail).toContain("22m");
		expect(verdict.detail).toContain("1h");
	});

	it("leaves passing checks without a stated reason", () => {
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, textbook);

		expect(verdict.gates.every((entry) => entry.because === "")).toBe(true);
	});

	it("shows each check's live measurement against its rule", () => {
		expect(gate(WALLET_LIVE_CONFIG, textbook, "conviction")?.actual).toBe("$650 at peak");
		expect(gate(WALLET_LIVE_CONFIG, textbook, "conviction")?.rule).toBe("≥ $500");
	});
});

describe("the boot check", () => {
	it("passes the live config with headroom the rule makes visible", () => {
		// $0.95 ceiling + 2 steps of room on the whole-cent grid reaches $0.97, so
		// five venue-minimum shares need $4.85 — the $5 ticket clears it.
		const boot = gate(WALLET_LIVE_CONFIG, textbook, "boot");

		expect(boot?.passed).toBe(true);
		expect(boot?.rule).toBe("≥ $4.85");
	});

	it("refuses to boot on a ticket that cannot buy five shares", () => {
		const verdict = evaluateLeaderSignal(withKnobs({ trade_size_usdc: 4.5 }), textbook);

		expect(verdict.action).toBe("no-boot");
		expect(verdict.headline).toBe("REFUSED AT BOOT");
		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("boot");
		expect(verdict.detail).toContain("refuses to start");
	});

	it("moves the boot bound when the price ceiling moves", () => {
		// A lower ceiling lowers the worst reachable limit, so a smaller ticket
		// becomes bootable: $0.50 + 2¢ of room → $2.60 for five shares.
		const cheap = withKnobs({ max_entry_price: 0.5, trade_size_usdc: 3 });

		expect(gate(cheap, textbook, "boot")?.rule).toBe("≥ $2.60");
		expect(gate(cheap, textbook, "boot")?.passed).toBe(true);
	});
});

describe("the conviction bar", () => {
	it("reports a sub-bar stake as no signal at all, never as a skip", () => {
		// Below the bar the tracker emits nothing, so the executor is never asked
		// and no skip card exists. Calling it a SKIP would advertise a refusal the
		// bot does not make.
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, smallPoke);

		expect(verdict.action).toBe("no-signal");
		expect(verdict.headline).toBe("NO SIGNAL");
		expect(verdict.detail).toContain("never emits");
		expect(gate(WALLET_LIVE_CONFIG, smallPoke, "conviction")?.actual).toBe("$180 at peak");
	});

	it("judges each leader against their own bar", () => {
		// $140 clears leader-b's $100 bar but would be a poke for leader-a.
		expect(evaluateLeaderSignal(WALLET_LIVE_CONFIG, leaderBBar).action).toBe("copy");
		expect(gate(WALLET_LIVE_CONFIG, leaderBBar, "conviction")?.rule).toBe("≥ $100");

		const raised = withKnobs({ leader_b_min_notional_usdc: 200 });
		expect(evaluateLeaderSignal(raised, leaderBBar).action).toBe("no-signal");
		// leader-a's scenarios are untouched by leader-b's slider.
		expect(evaluateLeaderSignal(raised, textbook).action).toBe("copy");
	});

	it("hands the same stake to the executor once the bar drops under it", () => {
		expect(
			evaluateLeaderSignal(withKnobs({ leader_a_min_notional_usdc: 150 }), smallPoke).action,
		).toBe("copy");
	});
});

describe("the two-sided flow rail", () => {
	it("refuses a leader whose recent flow runs both ways", () => {
		const flow = gate(WALLET_LIVE_CONFIG, twoSided, "flow");

		expect(flow?.passed).toBe(false);
		expect(flow?.actual).toBe("0.78");
		expect(flow?.rule).toBe("≤ 0.50");
	});

	it("lets the same leader through once the ceiling is raised past them", () => {
		expect(
			evaluateLeaderSignal(withKnobs({ max_wallet_two_sided_ratio: 0.8 }), twoSided).action,
		).toBe("copy");
	});

	it("stands down at a ceiling of one, which is the off position", () => {
		const off = withKnobs({ max_wallet_two_sided_ratio: 1 });

		expect(evaluateLeaderSignal(off, twoSided).action).toBe("copy");
		expect(gate(off, twoSided, "flow")?.rule).toBe("off");
	});

	it("stands down on an empty window instead of scoring it as clean", () => {
		// `null` is "nothing to weigh" — the rail cannot refuse on evidence that
		// was never measured, even at the strictest possible ceiling.
		const strict = withKnobs({ max_wallet_two_sided_ratio: 0 });

		expect(gate(WALLET_LIVE_CONFIG, emptyWindow, "flow")?.actual).toBe("nothing to weigh");
		expect(evaluateLeaderSignal(strict, emptyWindow).action).toBe("copy");
		// The same ceiling refuses any measured ratio at all.
		expect(evaluateLeaderSignal(strict, textbook).action).toBe("skip");
	});
});

describe("copying a position built by selling", () => {
	it("buys the outcome the leader actually holds, fee rail or no fee rail", () => {
		// A 7¢ ticket: the cluster bot's fee rail would refuse this outright; this
		// bot has no fee rail, and the page says so instead of hiding it.
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, cheapSide);

		expect(verdict.action).toBe("copy");
		expect(verdict.detail).toContain("selling the other side");
		expect(verdict.detail).toContain("$0.071");
	});

	it("carries the translation in the signal line", () => {
		const line = leaderSignalLine(cheapSide);

		expect(line.lead).toBe("leader-b built a $150 position in");
		expect(line.trail).toContain("selling the other side");
		expect(line.trail).toContain("$0.07");
	});

	it("states a plain buy plainly", () => {
		expect(leaderSignalLine(textbook)).toEqual({
			lead: "leader-a built a $650 position in",
			market: textbook.market,
			trail: "at $0.64.",
		});
	});
});

describe("the per-leader cap", () => {
	it("refuses a leader already at their cap while the budget still has room", () => {
		const verdict = evaluateLeaderSignal(WALLET_LIVE_CONFIG, spree);

		expect(verdict.gates.find((entry) => entry.blocker)?.id).toBe("cap");
		// The shared cap still had room — this is the per-leader rail, not the budget.
		expect(gate(WALLET_LIVE_CONFIG, spree, "room")?.passed).toBe(true);
	});

	it("lets the same spree through once the cap is raised", () => {
		expect(evaluateLeaderSignal(withKnobs({ max_open_copies_per_leader: 3 }), spree).action).toBe(
			"copy",
		);
	});
});

describe("evaluateTrim", () => {
	it("holds while the leader's selling stays under the line", () => {
		const verdict = evaluateTrim(WALLET_LIVE_CONFIG, 30);

		expect(verdict.action).toBe("hold");
		expect(verdict.headline).toBe("HOLD");
		expect(verdict.detail).toContain("30%");
		expect(verdict.detail).toContain("50%");
	});

	it("closes the whole leg at the line, not past it", () => {
		expect(evaluateTrim(WALLET_LIVE_CONFIG, 50).action).toBe("close");
		expect(evaluateTrim(WALLET_LIVE_CONFIG, 50).headline).toBe("CLOSE THE WHOLE LEG");
	});

	it("moves with the knob", () => {
		expect(evaluateTrim(withKnobs({ trim_close_fraction: 0.75 }), 60).action).toBe("hold");
		expect(evaluateTrim(withKnobs({ trim_close_fraction: 0.25 }), 30).action).toBe("close");
	});
});

describe("walletSummarySentence", () => {
	it("states the live config in one sentence", () => {
		const sentence = walletSummarySentence(WALLET_LIVE_CONFIG);

		expect(sentence).toContain("$500");
		expect(sentence).toContain("(leader-a)");
		expect(sentence).toContain("$100 (leader-b)");
		expect(sentence).toContain("0.50");
		expect(sentence).toContain("$1,000 of liquidity");
		expect(sentence).toContain("more than 1h left");
		expect(sentence).toContain("buys $5 ");
		expect(sentence).toContain("2 copies per leader");
		expect(sentence).toContain("$20 open in total");
		expect(sentence).toContain("unwound 50% of their peak");
	});

	it("rewrites itself from whatever the knobs currently say", () => {
		const sentence = walletSummarySentence(
			withKnobs({ leader_a_min_notional_usdc: 750, exposure_cap_usdc: 50 }),
		);

		expect(sentence).toContain("$750");
		expect(sentence).toContain("$50 open in total");
		expect(sentence).not.toContain("$500");
	});

	it("drops the flow clause when the rail is off", () => {
		const sentence = walletSummarySentence(withKnobs({ max_wallet_two_sided_ratio: 1 }));

		expect(sentence).toContain("whatever their recent flow looks like");
		expect(sentence).not.toContain("two-sided beyond");
	});
});

/**
 * Issue #74 assumptions: the wallet simulator reuses the issue-#73 mechanism —
 * an optional locale bundle (shared units + wallet strings resolved through
 * the Translation Catalog) parameterizes strings only. Decisions are asserted
 * identical across locales; string assertions check language and number
 * conventions, not exact seed-translation bytes. Leader labels (`leader-a`,
 * `leader-b`) must survive translation untouched.
 */
describe("localized wallet simulation", () => {
	const plSim = {
		locale: "pl",
		units: resolveSimUnits("pl"),
		strings: resolveWalletSim("pl"),
	} as const;
	const esSim = {
		locale: "es",
		units: resolveSimUnits("es"),
		strings: resolveWalletSim("es"),
	} as const;

	it("keeps every decision identical across locales", () => {
		for (const scenario of WALLET_SCENARIOS) {
			const english = evaluateLeaderSignal(WALLET_LIVE_CONFIG, scenario);
			const polish = evaluateLeaderSignal(WALLET_LIVE_CONFIG, scenario, plSim);

			expect(polish.action).toBe(english.action);
			expect(polish.gates.map(({ id, passed, blocker }) => ({ id, passed, blocker }))).toEqual(
				english.gates.map(({ id, passed, blocker }) => ({ id, passed, blocker })),
			);
		}
	});

	it("resolves verdict and gate strings in the target language", () => {
		const thin = WALLET_SCENARIOS.find((scenario) => scenario.id === "thin");
		if (!thin) throw new Error("thin scenario missing");
		const english = evaluateLeaderSignal(WALLET_LIVE_CONFIG, thin);
		const polish = evaluateLeaderSignal(WALLET_LIVE_CONFIG, thin, plSim);

		expect(polish.headline).not.toBe(english.headline);
		expect(polish.detail).not.toBe(english.detail);
		for (const [index, gateResult] of polish.gates.entries()) {
			expect(gateResult.question).not.toBe(english.gates[index]?.question);
		}
	});

	it("keeps leader labels untranslated inside localized strings", () => {
		const textbookSignal = WALLET_SCENARIOS[0];
		const polish = evaluateLeaderSignal(WALLET_LIVE_CONFIG, textbookSignal, plSim);
		const conviction = polish.gates.find((entry) => entry.id === "conviction");

		expect(conviction?.question).toContain("leader-a");
		expect(leaderSignalLine(textbookSignal, plSim).lead).toContain("leader-a");
		expect(walletSummarySentence(WALLET_LIVE_CONFIG, plSim)).toContain("(leader-a)");
		expect(walletSummarySentence(WALLET_LIVE_CONFIG, esSim)).toContain("(leader-b)");
	});

	it("formats numbers inside resolved strings with the locale conventions", () => {
		const polish = evaluateLeaderSignal(WALLET_LIVE_CONFIG, WALLET_SCENARIOS[0], plSim);
		const spanish = evaluateLeaderSignal(WALLET_LIVE_CONFIG, WALLET_SCENARIOS[0], esSim);

		expect(polish.gates.find((entry) => entry.id === "liquidity")?.rule).toContain("1\u00a0000");
		expect(spanish.gates.find((entry) => entry.id === "liquidity")?.rule).toContain("1.000");
	});

	it("speaks the trim verdicts in the target language", () => {
		const englishHold = evaluateTrim(WALLET_LIVE_CONFIG, 30);
		const polishHold = evaluateTrim(WALLET_LIVE_CONFIG, 30, plSim);
		const polishClose = evaluateTrim(WALLET_LIVE_CONFIG, 60, plSim);

		expect(polishHold.action).toBe(englishHold.action);
		expect(polishHold.headline).not.toBe(englishHold.headline);
		expect(polishHold.detail).not.toBe(englishHold.detail);
		expect(polishClose.action).toBe("close");
	});
});
