/**
 * Locale-parameterized value formatters for the for-dummies simulators
 * (issue #73). `formattersFor(locale, units)` builds the whole set from two
 * inputs: the locale's number conventions (grouping and decimal separators)
 * and the catalog-resolved unit templates carrying the words around the
 * numbers. The English instance is byte-identical to the legacy `format.ts`
 * formatters — that module now delegates here.
 *
 * Deliberately hand-rolled rather than `Intl.NumberFormat`: the SSR paint and
 * the client recompute must never disagree about a string, and ICU/CLDR
 * versions drift between Node, workerd and browsers. The conventions
 * themselves follow CLDR — pl groups with NBSP and points decimals with ",",
 * es groups with "." and points decimals with ",".
 */

import type { Locale } from "@/i18n/catalog";
import type { PluralTemplates, SimUnits } from "./sim-units-en";

export interface SimFormatters {
	/** `1234.5` → `"$1,234.50"` (en), `"1 234,50 $"` given pl units. */
	usd(value: number): string;
	/** An outcome price on the venue's grid, e.g. `"$0.641"`. */
	price(value: number): string;
	/** A price ceiling, where `0` means the rail is off rather than free. */
	priceLimit(value: number): string;
	shares(value: number): string;
	pct(value: number): string;
	/** `3600` → `"1h"`, `1320` → `"22m"`, `0` → off. */
	duration(seconds: number): string;
	steps(value: number): string;
	/** A YAML fraction (`0.02`) read out as a percentage (`"2%"`). */
	fraction(value: number): string;
	wallets(count: number): string;
	skilledWallets(count: number): string;
	/** Pick the CLDR form for `count` and fill its `{n}` with the count. */
	pluralize(templates: PluralTemplates, count: number): string;
}

interface NumberConventions {
	group: string;
	decimal: string;
}

const CONVENTIONS: Record<Locale, NumberConventions> = {
	en: { group: ",", decimal: "." },
	pl: { group: "\u00a0", decimal: "," },
	es: { group: ".", decimal: "," },
};

/**
 * Fill `{key}` placeholders, every occurrence. Split/join rather than a
 * RegExp so translated values can never inject pattern syntax.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
	let out = template;
	for (const [key, value] of Object.entries(values)) {
		out = out.split(`{${key}}`).join(value);
	}
	return out;
}

/**
 * CLDR plural category, flattened to the three forms the unit templates
 * carry. English and Spanish only distinguish one/other (`many` here);
 * Polish adds `few`, with fractional counts resolving to `many`.
 */
function pluralCategory(locale: Locale, count: number): keyof PluralTemplates {
	if (count === 1) return "one";
	if (locale !== "pl" || !Number.isInteger(count)) return "many";
	const mod10 = count % 10;
	const mod100 = count % 100;
	return mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? "few" : "many";
}

/** Apply grouping and decimal separators to an en-style digit string. */
function renderDigits(text: string, conventions: NumberConventions): string {
	const [whole = "0", fraction] = text.split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+$)/g, conventions.group);
	return fraction === undefined ? grouped : `${grouped}${conventions.decimal}${fraction}`;
}

export function formattersFor(locale: Locale, units: SimUnits): SimFormatters {
	const conventions = CONVENTIONS[locale];

	const render = (text: string): string => renderDigits(text, conventions);

	const plural = (templates: PluralTemplates, count: number, body: string): string =>
		fillTemplate(templates[pluralCategory(locale, count)], { n: body });

	const pct = (value: number): string => {
		const rounded = Math.round(value * 10) / 10;
		const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
		return fillTemplate(units.pct, { n: render(text) });
	};

	const price = (value: number): string => {
		const rounded = Math.round(value * 1000) / 1000;
		const text = rounded.toFixed(3).replace(/0$/, "");
		return fillTemplate(units.usd, { n: render(text) });
	};

	return {
		usd(value) {
			const rounded = Math.round(value * 100) / 100;
			const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
			const sign = rounded < 0 ? "-" : "";
			return `${sign}${fillTemplate(units.usd, { n: render(text.replace("-", "")) })}`;
		},
		price,
		priceLimit(value) {
			return value <= 0 ? units.off : price(value);
		},
		shares(value) {
			const rounded = Math.round(value * 10) / 10;
			const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
			return plural(units.share, rounded, render(text));
		},
		pct,
		duration(seconds) {
			if (seconds <= 0) return units.off;
			if (seconds < 3600) {
				return fillTemplate(units.minutes, { n: render(String(Math.round(seconds / 60))) });
			}
			const hours = seconds / 3600;
			if (hours < 24) {
				const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
				return fillTemplate(units.hours, { n: render(text) });
			}
			const days = hours / 24;
			const text = Number.isInteger(days) ? String(days) : days.toFixed(1);
			return fillTemplate(units.days, { n: render(text) });
		},
		steps(value) {
			if (value <= 0) return units.off;
			return plural(units.step, value, render(String(value)));
		},
		fraction(value) {
			return value <= 0 ? units.off : pct(value * 100);
		},
		wallets(count) {
			return plural(units.wallet, count, render(String(count)));
		},
		skilledWallets(count) {
			return plural(units.skilledWallet, count, render(String(count)));
		},
		pluralize(templates, count) {
			return plural(templates, count, render(String(count)));
		},
	};
}
