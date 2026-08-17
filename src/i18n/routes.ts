/**
 * Locale-aware URL helpers — the single place that knows English lives
 * unprefixed at the root while translated locales live under /pl and /es.
 * Pure so the switcher and hreflang wiring test at this boundary.
 */

import type { Locale } from "./catalog";

const LOCALES: readonly Locale[] = ["en", "pl", "es"];

/** Narrow a routing-layer locale string (e.g. `Astro.currentLocale`) to a `Locale`. */
export function toLocale(value: string | undefined): Locale {
	return value !== undefined && (LOCALES as readonly string[]).includes(value)
		? (value as Locale)
		: "en";
}

/** Root-relative URL of a page in a locale; `path` is "" for home. */
export function localeHref(locale: Locale, path: string): string {
	if (locale === "en") return path === "" ? "/" : path;
	return `/${locale}${path}`;
}

export interface HreflangAlternate {
	hreflang: string;
	href: string;
}

/**
 * Absolute hreflang alternates for a page available in all three locales,
 * plus x-default pointing at the canonical English variant.
 */
export function hreflangAlternates(siteUrl: string, path: string): HreflangAlternate[] {
	const alternates = LOCALES.map((locale) => ({
		hreflang: locale,
		href: `${siteUrl}${localeHref(locale, path)}`,
	}));
	return [...alternates, { hreflang: "x-default", href: `${siteUrl}${localeHref("en", path)}` }];
}

export interface SwitcherOption {
	locale: Locale;
	label: string;
	href: string;
	current: boolean;
}

/** The EN/PL/ES switcher entries for a page, same page in each locale. */
export function switcherOptions(currentLocale: Locale, path: string): SwitcherOption[] {
	return LOCALES.map((locale) => ({
		locale,
		label: locale.toUpperCase(),
		href: localeHref(locale, path),
		current: locale === currentLocale,
	}));
}
