/**
 * Translation Catalog — the single resolve boundary for localized prose.
 *
 * English prose stays canonical in typed TS content modules; per-locale JSON
 * overlays map stable dot-path keys to `{ translation, sourceHash }`. A
 * translation renders only when its `sourceHash` still matches the current
 * English source — otherwise the current English renders (per-key fallback).
 * No consumer contains its own fallback logic.
 */

import { z } from "zod";
import { HOME_EN, type HomeProse } from "./home-en";
import plOverlayJson from "./locales/pl.json";

interface TranslationEntry {
	translation: string;
	sourceHash: string;
}

export type TranslationOverlay = Record<string, TranslationEntry>;

/** Nested prose object: string leaves keyed by stable names. */
export interface ProseNode {
	[key: string]: string | ProseNode;
}

/**
 * Content hash of an English source string (FNV-1a 32-bit, hex). Pure and
 * dependency-free so it runs identically in Workers, Node, and tests.
 */
export function hashSource(text: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}

function resolveNode(en: ProseNode, overlay: TranslationOverlay, prefix: string): ProseNode {
	const resolved: ProseNode = {};
	for (const [key, value] of Object.entries(en)) {
		const path = prefix === "" ? key : `${prefix}.${key}`;
		if (typeof value === "string") {
			const entry = overlay[path];
			resolved[key] =
				entry !== undefined && entry.sourceHash === hashSource(value) ? entry.translation : value;
		} else {
			resolved[key] = resolveNode(value, overlay, path);
		}
	}
	return resolved;
}

/**
 * Resolve an English prose object against a locale overlay. Returns an object
 * of the identical shape; every leaf is either a still-fresh translation or
 * the current English source.
 */
export function resolveProse<T extends ProseNode>(en: T, overlay: TranslationOverlay): T {
	return resolveNode(en, overlay, "") as T;
}

export type Locale = "en" | "pl";

// Overlays are repo-internal JSON, but hand-edited by a translator — validate
// the shape once at module load so a malformed entry fails the build, not a
// request.
const OverlaySchema = z.record(
	z.string(),
	z.object({ translation: z.string(), sourceHash: z.string() }),
);

const PL_OVERLAY: TranslationOverlay = OverlaySchema.parse(plOverlayJson);

/** Home-page prose resolved for a locale — the same shape as `HOME_EN`. */
export function resolveHomeProse(locale: Locale): HomeProse {
	return locale === "en" ? HOME_EN : resolveProse(HOME_EN, PL_OVERLAY);
}
