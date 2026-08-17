/**
 * Canonical English unit templates shared by both for-dummies simulators,
 * keyed for the Translation Catalog under the `sim` namespace (issue #73).
 * The numbers themselves are never translated — these templates only carry
 * the words and symbols around them (`{n}` is filled by the formatters).
 *
 * Plural forms follow CLDR categories flattened to one/few/many: English and
 * Spanish only ever use `one` and `many`, so their `few` strings repeat
 * `many`; Polish uses all three. Fractional counts resolve to `many`.
 */

/** One pluralizable unit word, `{n}` standing for the rendered number. */
export type PluralTemplates = {
	one: string;
	few: string;
	many: string;
};

// A type alias (not an interface) so the shape gets TypeScript's implicit
// index signature and stays assignable to the catalog's ProseNode.
export type SimUnits = {
	/** Money and prices; placement of the symbol is the translation's call. */
	usd: string;
	pct: string;
	share: PluralTemplates;
	step: PluralTemplates;
	wallet: PluralTemplates;
	skilledWallet: PluralTemplates;
	minutes: string;
	hours: string;
	days: string;
	/** A disabled rail or a zero threshold, e.g. a lookback window of 0. */
	off: string;
};

export const SIM_UNITS_EN: SimUnits = {
	// biome-ignore lint/suspicious/noTemplateCurlyInString: "$" is the currency symbol ahead of the {n} placeholder, not a template literal
	usd: "${n}",
	pct: "{n}%",
	share: { one: "{n} share", few: "{n} shares", many: "{n} shares" },
	step: { one: "{n} step", few: "{n} steps", many: "{n} steps" },
	wallet: { one: "{n} wallet", few: "{n} wallets", many: "{n} wallets" },
	skilledWallet: {
		one: "{n} skilled wallet",
		few: "{n} skilled wallets",
		many: "{n} skilled wallets",
	},
	minutes: "{n}m",
	hours: "{n}h",
	days: "{n}d",
	off: "off",
};
