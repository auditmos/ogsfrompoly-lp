import { formatPercent } from "./percent";

/**
 * Display value for the hit-rate stat.
 *
 * `hit_rate` is `in_favor / resolved` over alerts **emitted** in the period, so
 * a known-empty denominator makes it vacuous rather than a 0% success rate.
 * Rendering that as "0%" is what published "263 calls, all wrong"
 * (auditmos/ogsfrompoly#236).
 */
export function formatHitRate(hitRate: number, resolvedCount?: number): string {
	return resolvedCount === 0 ? "pending" : formatPercent(hitRate);
}

const STANDING_NOTE =
	"Share of resolved alerts that hit the predicted side. 0.50 ≈ a coin flip; above 0.50 is signal.";

/**
 * The sentence explaining what the hit-rate stat is measured over.
 *
 * An unresolved window gets its own wording rather than an appended caveat: the
 * standing note's "above 0.50 is signal" reads as a verdict on the number beside
 * it, which is exactly the misreading a vacuous rate invites.
 */
export function describeHitRate(alertCount: number, resolvedCount?: number): string {
	if (resolvedCount === 0) {
		return (
			`No outcomes have settled yet — 0 of ${alertCount} alerts have resolved, ` +
			"so there is no rate to report. Macro markets typically resolve months " +
			"after the alert fires."
		);
	}
	if (resolvedCount === undefined) return STANDING_NOTE;
	return `${STANDING_NOTE} Measured over the ${resolvedCount} of ${alertCount} alerts that have resolved.`;
}
