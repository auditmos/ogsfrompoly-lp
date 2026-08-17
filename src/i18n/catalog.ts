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
import { CLUSTER_PAGE_EN, type ClusterPageProse } from "@/copy-trade/cluster/page-prose-en";
import { CLUSTER_SIM_EN, type ClusterSimStrings } from "@/copy-trade/cluster/sim-prose-en";
import { HUB_EN, type HubProse } from "@/copy-trade/hub-prose-en";
import { SIM_UNITS_EN, type SimUnits } from "@/copy-trade/sim-units-en";
import { WALLET_PAGE_EN, type WalletPageProse } from "@/copy-trade/wallet/page-prose-en";
import { WALLET_SIM_EN, type WalletSimStrings } from "@/copy-trade/wallet/sim-prose-en";
import { METHODOLOGY_EN, type MethodologyProse } from "@/methodology/prose-en";
import { HOME_EN, type HomeProse } from "./home-en";
import esOverlayJson from "./locales/es.json";
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

/** One catalog key with its current English source, as handed to translators. */
export interface CatalogEntry {
	key: string;
	text: string;
	sourceHash: string;
}

function collectEntries(node: ProseNode, prefix: string, out: CatalogEntry[]): void {
	for (const [key, value] of Object.entries(node)) {
		const path = prefix === "" ? key : `${prefix}.${key}`;
		if (typeof value === "string") {
			out.push({ key: path, text: value, sourceHash: hashSource(value) });
		} else {
			collectEntries(value, path, out);
		}
	}
}

/**
 * Flattened key/source/hash entries of a prose object, sorted by key — the
 * extraction view of the catalog the translator handoff reads.
 */
export function proseEntries(prose: ProseNode): CatalogEntry[] {
	const out: CatalogEntry[] = [];
	collectEntries(prose, "", out);
	// Codepoint order, not localeCompare — collation must not vary by environment.
	return out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

export type Locale = "en" | "pl" | "es";

// Overlays are repo-internal JSON, but hand-edited by a translator — validate
// the shape once at module load so a malformed entry fails the build, not a
// request.
const OverlaySchema = z.record(
	z.string(),
	z.object({ translation: z.string(), sourceHash: z.string() }),
);

const PL_OVERLAY: TranslationOverlay = OverlaySchema.parse(plOverlayJson);
const ES_OVERLAY: TranslationOverlay = OverlaySchema.parse(esOverlayJson);

/** Home-page prose resolved for a locale — the same shape as `HOME_EN`. */
export function resolveHomeProse(locale: Locale): HomeProse {
	return locale === "en" ? HOME_EN : resolveProse(HOME_EN, OVERLAYS[locale]);
}

/** Methodology prose resolved for a locale — the same shape as `METHODOLOGY_EN`. */
export function resolveMethodologyProse(locale: Locale): MethodologyProse {
	if (locale === "en") return METHODOLOGY_EN;
	return resolveProse({ methodology: METHODOLOGY_EN }, OVERLAYS[locale]).methodology;
}

/** For-dummies hub strings resolved for a locale — the same shape as `HUB_EN`. */
export function resolveHubProse(locale: Locale): HubProse {
	if (locale === "en") return HUB_EN;
	return resolveProse({ hub: HUB_EN }, OVERLAYS[locale]).hub;
}

/** Shared simulator unit templates resolved for a locale. */
export function resolveSimUnits(locale: Locale): SimUnits {
	if (locale === "en") return SIM_UNITS_EN;
	return resolveProse({ sim: SIM_UNITS_EN }, OVERLAYS[locale]).sim;
}

/** Cluster-simulator decision strings resolved for a locale. */
export function resolveClusterSim(locale: Locale): ClusterSimStrings {
	if (locale === "en") return CLUSTER_SIM_EN;
	return resolveProse({ cluster: { sim: CLUSTER_SIM_EN } }, OVERLAYS[locale]).cluster.sim;
}

/** Cluster walkthrough page prose resolved for a locale. */
export function resolveClusterPage(locale: Locale): ClusterPageProse {
	if (locale === "en") return CLUSTER_PAGE_EN;
	return resolveProse({ cluster: { page: CLUSTER_PAGE_EN } }, OVERLAYS[locale]).cluster.page;
}

/** Wallet-simulator decision strings resolved for a locale. */
export function resolveWalletSim(locale: Locale): WalletSimStrings {
	if (locale === "en") return WALLET_SIM_EN;
	return resolveProse({ wallet: { sim: WALLET_SIM_EN } }, OVERLAYS[locale]).wallet.sim;
}

/** Wallet walkthrough page prose resolved for a locale. */
export function resolveWalletPage(locale: Locale): WalletPageProse {
	if (locale === "en") return WALLET_PAGE_EN;
	return resolveProse({ wallet: { page: WALLET_PAGE_EN } }, OVERLAYS[locale]).wallet.page;
}

/** Locales translations are delivered for — the extractor reports on each. */
export type TranslatedLocale = "pl" | "es";

export const TRANSLATED_LOCALES: readonly TranslatedLocale[] = ["pl", "es"];

const OVERLAYS: Record<TranslatedLocale, TranslationOverlay> = {
	pl: PL_OVERLAY,
	es: ES_OVERLAY,
};

/** The delivered overlay for a locale — empty until a delivery lands. */
export function localeOverlay(locale: TranslatedLocale): TranslationOverlay {
	return OVERLAYS[locale];
}

/**
 * Every English key currently registered in the catalog, flattened and sorted.
 * The translator handoff reads keys only through this boundary; prose modules
 * added by later phases join the registry here and appear automatically.
 */
export function catalogEntries(): CatalogEntry[] {
	// Home keys are historically unprefixed; every later module registers under
	// its own top-level namespace so keys can never collide.
	return proseEntries({
		...HOME_EN,
		methodology: METHODOLOGY_EN,
		hub: HUB_EN,
		sim: SIM_UNITS_EN,
		cluster: { sim: CLUSTER_SIM_EN, page: CLUSTER_PAGE_EN },
		wallet: { sim: WALLET_SIM_EN, page: WALLET_PAGE_EN },
	});
}
