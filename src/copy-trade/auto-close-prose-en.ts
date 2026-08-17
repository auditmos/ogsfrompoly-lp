/**
 * Canonical English strings for the auto-close widget, shared by both
 * walkthroughs and keyed for the Translation Catalog under `autoClose`
 * (issue #77).
 *
 * Shared rather than duplicated per page because the rail is literally the
 * same code on both bots — one shared evaluator, one poll cadence, one
 * debounce. Two copies of these strings could drift into describing two
 * different rules, and only one of them would be true.
 *
 * The numbers themselves never live here: `{n}`, `{pct}`, `{size}` and friends
 * are filled by the formatters, so a locale's grouping and decimal
 * conventions stay outside the translation payload.
 */

// A type alias (not an interface) so the shape gets TypeScript's implicit
// index signature and stays assignable to the catalog's ProseNode.
export type AutoCloseSimStrings = {
	heading: string;
	/** One line under the heading, before the reader touches anything. */
	blurb: string;
	pathLabel: string;
	/** The invented position every path is quoted against. */
	position: string;
	/** A tick's label. The rail polls about once a minute, so a tick is one. */
	tick: string;
	/** Column headings for the tick table. */
	columnReading: string;
	columnState: string;
	/** Per-tick state words. */
	stateQuiet: string;
	stateArmed: string;
	stateClosed: string;
	stateNoBid: string;
	verdict: {
		disarmedHeadline: string;
		disarmedDetail: string;
		heldHeadline: string;
		heldDetail: string;
		stopHeadline: string;
		stopDetail: string;
		profitHeadline: string;
		profitDetail: string;
	};
	/** Path names, keyed by scenario id. */
	paths: {
		"drifts-down": string;
		"runs-up": string;
		whipsaw: string;
		"book-gap": string;
	};
	/** The disclosure line under the widget. Load-bearing, not decoration. */
	note: string;
	noscript: string;
	ariaLabel: string;
};

export const AUTO_CLOSE_SIM_EN: AutoCloseSimStrings = {
	heading: "And when does it sell on its own numbers? Arm the rail",
	blurb: `Both sliders start where the running config has them: off. Arm either side and
watch the same position play out — the rail reads the book about once a minute
and wants the same answer twice before it does anything.`,
	pathLabel: "Price path",
	position: "{size} bought at {entry} — {shares}, fees included both ways.",
	tick: "min {n}",
	columnReading: "what a close would realize",
	columnState: "rail",
	stateQuiet: "inside both lines",
	stateArmed: "past the line — 1 of 2",
	stateClosed: "sold",
	stateNoBid: "no bid — skipped, streak forgotten",
	verdict: {
		disarmedHeadline: "Disarmed",
		disarmedDetail: `Neither threshold is set, which is what the live config says, so this rail never
fires. The position leaves the way it always has — when the exit rule above says
so, or at resolution.`,
		heldHeadline: "Held",
		heldDetail: `Nothing here breached twice in a row, so the rail never fired. The position is
still open at {pct}.`,
		stopHeadline: "Stopped out",
		stopDetail: `Down {pct} on the second consecutive reading past {threshold}, so the whole
position went at {tick}, booked as a stop-loss.`,
		profitHeadline: "Took profit",
		profitDetail: `Up {pct} on the second consecutive reading past {threshold}, so the whole
position went at {tick}, booked as a take-profit.`,
	},
	paths: {
		"drifts-down": "Drifts down",
		"runs-up": "Runs up",
		whipsaw: "Crosses and comes back",
		"book-gap": "Book goes dark",
	},
	note: `The rail is deployed on both agents and armed on neither. When we do arm it we
will not publish the numbers: a threshold is something a reader could trade
against while a position is still open. Everything on this page is the rule, not
our settings.`,
	noscript: "The sliders and the path buttons need JavaScript to recompute.",
	ariaLabel: "Auto-close rail simulator",
};
