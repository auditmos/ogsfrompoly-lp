#!/usr/bin/env tsx
/**
 * Translator Handoff Extractor: regenerates the two artifacts a translator
 * works from — src/i18n/handoff/en.json (key → English text + sourceHash) and
 * src/i18n/handoff/status.json (per-locale translated / missing / stale
 * classification). Reads keys only through the Translation Catalog's public
 * boundary; deterministic, so re-running with no catalog changes is
 * byte-identical. Run with `pnpm i18n:extract`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogEntries, localeOverlay, TRANSLATED_LOCALES } from "@/i18n/catalog";
import { buildHandoff, buildStatusReport } from "@/i18n/extract";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HANDOFF_DIR = path.join(ROOT, "src", "i18n", "handoff");

const entries = catalogEntries();
const overlays = Object.fromEntries(
	TRANSLATED_LOCALES.map((locale) => [locale, localeOverlay(locale)]),
);

await mkdir(HANDOFF_DIR, { recursive: true });
await writeFile(path.join(HANDOFF_DIR, "en.json"), buildHandoff(entries), "utf8");
await writeFile(
	path.join(HANDOFF_DIR, "status.json"),
	buildStatusReport(entries, overlays),
	"utf8",
);

console.log(`✓ ${entries.length} catalog key(s) → src/i18n/handoff/{en,status}.json`);
