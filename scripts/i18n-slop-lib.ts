/**
 * Pure helpers behind `pnpm i18n:slop` (scripts/verify-i18n-slop.ts): build
 * the line-per-string document sloplint scores, strip the em-dash rule (this
 * site's locked house style — anti-slop.md counts em-dashes only when
 * clustered with other tells), map finding line numbers back to catalog keys,
 * and decide pass/fail. Everything here is side-effect free; the orchestrator
 * owns filesystem and process concerns.
 */

import { z } from "zod";

/** One scoreable string: a catalog key (en) or overlay key (pl/es). */
export interface ScoreItem {
	key: string;
	text: string;
}

const SloplintFindingSchema = z.object({
	id: z.string().optional(),
	category: z.string(),
	weight: z.number(),
	match: z.string(),
	line: z.number(),
	note: z.string().optional(),
	fix: z.string().optional(),
});

const SloplintResultSchema = z.object({
	score: z.number(),
	stats: z.object({
		wordCount: z.number(),
		burstiness: z.number(),
		typeTokenRatio: z.number(),
		trigramRepetition: z.number(),
	}),
	findings: z.array(SloplintFindingSchema),
});

export type SloplintResult = z.infer<typeof SloplintResultSchema>;

export interface KeyedFinding extends z.infer<typeof SloplintFindingSchema> {
	key: string;
}

export interface LocaleReport {
	locale: string;
	score: number;
	stats: SloplintResult["stats"];
	findings: KeyedFinding[];
}

/** Adjusted score at or above this fails the check (mirrors score-content.sh). */
export const SCORE_THRESHOLD = 25;

/** A single finding at or above this weight fails the check even under-threshold. */
export const FINDING_WEIGHT_THRESHOLD = 4;

/** Simulator legend symbols the emoji rule must not count as decorative emoji. */
const LEGEND_SYMBOLS = new Set(["✓", "✗"]);

/**
 * Lay the strings out one per line with a blank separator, so sloplint treats
 * each as its own sentence context and finding line numbers map back to keys:
 * item i sits on line 2i+1.
 */
export function buildScoreDocument(items: readonly ScoreItem[]): {
	text: string;
	keyForLine: readonly string[];
} {
	const lines: string[] = [];
	const keyForLine: string[] = [];
	for (const item of items) {
		lines.push(item.text.replace(/\n/g, " "), "");
		keyForLine.push(item.key, "");
	}
	return { text: lines.join("\n"), keyForLine };
}

const RulePackSchema = z
	.object({ regex: z.array(z.object({ id: z.string() }).loose()).optional() })
	.loose();

/**
 * Return the rule pack with the em-dash regex rule removed. Em dashes are the
 * site's house style (the locked hero claim uses one); scoring them would
 * flag every locale at ~50/100 on typography alone.
 */
export function stripEmDashRule(packJson: string): string {
	const pack = RulePackSchema.parse(JSON.parse(packJson));
	if (pack.regex !== undefined) {
		pack.regex = pack.regex.filter((rule) => rule.id !== "em-dash");
	}
	return JSON.stringify(pack);
}

/**
 * Validate sloplint's `analyze --json` output, attach the owning catalog key
 * to each finding, and drop the ✓/✗ simulator-legend hits the emoji rule
 * mistakes for decoration.
 */
export function parseLocaleReport(
	locale: string,
	sloplintJson: string,
	keyForLine: readonly string[],
): LocaleReport {
	const result = SloplintResultSchema.parse(JSON.parse(sloplintJson));
	const findings = result.findings
		.map((finding) => ({
			key: keyForLine[finding.line - 1] ?? `line-${finding.line}`,
			...finding,
		}))
		.filter((finding) => !(finding.id === "emoji" && LEGEND_SYMBOLS.has(finding.match)));
	return { locale, score: result.score, stats: result.stats, findings };
}

/** Human-readable reasons the check fails; empty means all locales pass. */
export function breaches(reports: readonly LocaleReport[]): string[] {
	const out: string[] = [];
	for (const report of reports) {
		if (report.score >= SCORE_THRESHOLD) {
			out.push(`${report.locale}: score ${report.score} >= ${SCORE_THRESHOLD}`);
		}
		for (const finding of report.findings) {
			if (finding.weight >= FINDING_WEIGHT_THRESHOLD) {
				out.push(
					`${report.locale}: ${finding.key} — [w${finding.weight} ${finding.category}] "${finding.match}"`,
				);
			}
		}
	}
	return out;
}

/** One table row per locale plus a line per finding, ready to print. */
export function formatReport(reports: readonly LocaleReport[]): string {
	const lines: string[] = [
		"LOCALE  SCORE  BURSTINESS  TTR    FINDINGS",
		"------------------------------------------",
	];
	for (const report of reports) {
		const { burstiness, typeTokenRatio } = report.stats;
		lines.push(
			`${report.locale.padEnd(8)}${String(report.score).padEnd(7)}${burstiness.toFixed(2).padEnd(12)}${typeTokenRatio.toFixed(2).padEnd(7)}${report.findings.length}`,
		);
		for (const finding of report.findings) {
			lines.push(
				`  ${finding.key}: [w${finding.weight} ${finding.category}] "${finding.match}"${finding.fix ? ` → ${finding.fix}` : ""}`,
			);
		}
	}
	lines.push(
		"------------------------------------------",
		`target: score < ${SCORE_THRESHOLD} · burstiness > 0.45 · TTR > 0.45 · no findings of weight >= ${FINDING_WEIGHT_THRESHOLD}`,
	);
	return lines.join("\n");
}
