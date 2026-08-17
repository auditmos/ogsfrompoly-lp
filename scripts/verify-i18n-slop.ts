#!/usr/bin/env tsx
/**
 * i18n anti-slop verification: scores every locale's current prose (en from
 * the catalog, pl/es from the delivered overlays) with the writes-repo
 * sloplint and its per-language rule packs. Fails when any locale scores at
 * or above 25 or carries a weight-4+ finding (calques, LinkedIn clichés,
 * engagement bait). Style check only — meaning drift and disclosure nuance
 * still need the human read (issue #69's HITL gate). Run with `pnpm i18n:slop`.
 *
 * The sloplint tooling lives in the private auditmos/writes repo; its
 * installer symlinks it to ~/.claude/content-rules/sloplint. Machines without
 * it (CI included) skip with a notice instead of failing. Override the
 * location with SLOPLINT_DIR.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { catalogEntries, localeOverlay, TRANSLATED_LOCALES } from "@/i18n/catalog";
import {
	breaches,
	buildScoreDocument,
	formatReport,
	type LocaleReport,
	parseLocaleReport,
	type ScoreItem,
	stripEmDashRule,
} from "./i18n-slop-lib";

const SLOPLINT_DIR =
	process.env.SLOPLINT_DIR ?? path.join(os.homedir(), ".claude", "content-rules", "sloplint");
const SLOPLINT_BIN = path.join(SLOPLINT_DIR, "bin", "sloplint.js");
const RULE_PACKS: Record<string, string> = {
	en: "slop-rules.json",
	pl: "slop-rules.pl.json",
	es: "slop-rules.es.json",
};

if (!existsSync(SLOPLINT_BIN)) {
	console.log(`i18n:slop SKIPPED — sloplint not found at ${SLOPLINT_BIN}`);
	console.log("Install the writes repo (auditmos/writes) or set SLOPLINT_DIR.");
	process.exit(0);
}

const localeItems: Record<string, ScoreItem[]> = {
	en: catalogEntries().map(({ key, text }) => ({ key, text })),
};
for (const locale of TRANSLATED_LOCALES) {
	localeItems[locale] = Object.entries(localeOverlay(locale)).map(([key, entry]) => ({
		key,
		text: entry.translation,
	}));
}

const workDir = mkdtempSync(path.join(os.tmpdir(), "i18n-slop-"));
const reports: LocaleReport[] = [];
try {
	for (const [locale, items] of Object.entries(localeItems)) {
		const packName = RULE_PACKS[locale];
		if (packName === undefined) continue;
		const packPath = path.join(SLOPLINT_DIR, "rules", packName);
		if (!existsSync(packPath)) {
			console.log(`i18n:slop ${locale} SKIPPED — rule pack missing: ${packPath}`);
			continue;
		}

		const { text, keyForLine } = buildScoreDocument(items);
		const docPath = path.join(workDir, `${locale}.txt`);
		writeFileSync(docPath, text, "utf8");
		const filteredPackPath = path.join(workDir, `${locale}-rules.json`);
		writeFileSync(filteredPackPath, stripEmDashRule(readFileSync(packPath, "utf8")), "utf8");

		const output = execFileSync(
			"node",
			[SLOPLINT_BIN, "analyze", docPath, "--json", "--rules", filteredPackPath],
			{ encoding: "utf8" },
		);
		reports.push(parseLocaleReport(locale, output, keyForLine));
	}
} finally {
	rmSync(workDir, { recursive: true, force: true });
}

console.log(formatReport(reports));

const failures = breaches(reports);
if (failures.length > 0) {
	console.error(`\n✗ i18n:slop failed:\n${failures.map((f) => `  ${f}`).join("\n")}`);
	process.exit(1);
}
console.log(`\n✓ ${reports.length} locale(s) clean`);
