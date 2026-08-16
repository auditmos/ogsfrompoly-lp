/**
 * Translator Handoff Extractor — pure builders for the two generated
 * artifacts: the en.json handoff (key → English text + sourceHash) and the
 * per-locale status report (key → translated / missing / stale). Both are
 * serialized here so the byte layout is owned by one place and re-running on
 * unchanged input is byte-identical. The side-effecting orchestrator lives in
 * scripts/extract-translations.ts.
 */

import type { CatalogEntry, TranslationOverlay } from "./catalog";

type TranslationStatus = "translated" | "missing" | "stale";

function sortedByKey(entries: readonly CatalogEntry[]): CatalogEntry[] {
	return [...entries].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** Serialize the en.json handoff a translator works from. */
export function buildHandoff(entries: readonly CatalogEntry[]): string {
	const handoff: Record<string, { text: string; sourceHash: string }> = {};
	for (const entry of sortedByKey(entries)) {
		handoff[entry.key] = { text: entry.text, sourceHash: entry.sourceHash };
	}
	return `${JSON.stringify(handoff, null, "\t")}\n`;
}

function classify(entry: CatalogEntry, overlay: TranslationOverlay): TranslationStatus {
	const delivered = overlay[entry.key];
	if (delivered === undefined) return "missing";
	return delivered.sourceHash === entry.sourceHash ? "translated" : "stale";
}

/** Serialize the per-locale status report: every catalog key classified. */
export function buildStatusReport(
	entries: readonly CatalogEntry[],
	overlays: Readonly<Record<string, TranslationOverlay>>,
): string {
	const report: Record<string, Record<string, TranslationStatus>> = {};
	for (const locale of Object.keys(overlays).sort()) {
		const overlay = overlays[locale];
		if (overlay === undefined) continue;
		const statuses: Record<string, TranslationStatus> = {};
		for (const entry of sortedByKey(entries)) {
			statuses[entry.key] = classify(entry, overlay);
		}
		report[locale] = statuses;
	}
	return `${JSON.stringify(report, null, "\t")}\n`;
}
