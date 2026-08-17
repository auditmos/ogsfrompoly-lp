/**
 * Assumptions encoded by these tests (issue #73):
 *
 * - Input: finite numbers already in the units the knobs carry (USDC, %,
 *   seconds, grid steps, fractions of a ticket, share counts).
 * - Output: strings rendered with the locale's number conventions — en groups
 *   with "," and points decimals with "."; pl groups with NBSP (U+00A0) and
 *   points decimals with ","; es groups with "." and points decimals with ",".
 *   Unit words come from translatable templates (`SimUnits`), never from code.
 * - The English instance must be byte-identical to the legacy `format.ts`
 *   output — the SSR paint and client recompute already rely on that.
 * - Deliberately hand-rolled rather than `Intl.NumberFormat` so Node, workerd
 *   and every browser produce identical bytes (no ICU/CLDR drift); the locale
 *   conventions themselves follow CLDR.
 * - Not tested here: which locale a page resolves (routing), overlay content.
 */

import { formattersFor } from "./locale-format";
import { SIM_UNITS_EN } from "./sim-units-en";

describe("formattersFor", () => {
	it("renders money with the locale's grouping and decimal conventions", () => {
		expect(formattersFor("pl", SIM_UNITS_EN).usd(1000.5)).toContain("1\u00a0000,50");
		expect(formattersFor("es", SIM_UNITS_EN).usd(1000.5)).toContain("1.000,50");
	});

	it("keeps the English instance byte-identical to the legacy formatters", () => {
		const fmt = formattersFor("en", SIM_UNITS_EN);

		expect(fmt.usd(1234.5)).toBe("$1,234.50");
		expect(fmt.usd(1000)).toBe("$1,000");
		expect(fmt.usd(-5)).toBe("-$5");
		expect(fmt.price(0.641)).toBe("$0.641");
		expect(fmt.price(0.6)).toBe("$0.60");
		expect(fmt.priceLimit(0)).toBe("off");
		expect(fmt.shares(13.774)).toBe("13.8 shares");
		expect(fmt.shares(1.04)).toBe("1 share");
		expect(fmt.pct(1.5)).toBe("1.5%");
		expect(fmt.duration(3600)).toBe("1h");
		expect(fmt.duration(1320)).toBe("22m");
		expect(fmt.duration(0)).toBe("off");
		expect(fmt.steps(2)).toBe("2 steps");
		expect(fmt.steps(0)).toBe("off");
		expect(fmt.fraction(0.02)).toBe("2%");
		expect(fmt.skilledWallets(4)).toBe("4 skilled wallets");
		expect(fmt.skilledWallets(1)).toBe("1 skilled wallet");
	});

	it("picks the Polish few/many plural forms by CLDR rules", () => {
		const plUnits = {
			...SIM_UNITS_EN,
			wallet: { one: "{n} portfel", few: "{n} portfele", many: "{n} portfeli" },
		};
		const fmt = formattersFor("pl", plUnits);

		expect(fmt.wallets(1)).toBe("1 portfel");
		expect(fmt.wallets(3)).toBe("3 portfele");
		expect(fmt.wallets(5)).toBe("5 portfeli");
		expect(fmt.wallets(12)).toBe("12 portfeli");
		expect(fmt.wallets(22)).toBe("22 portfele");
	});

	it("renders flow ratios with locale decimals, off at 1", () => {
		expect(formattersFor("en", SIM_UNITS_EN).ratio(0.78)).toBe("0.78");
		expect(formattersFor("en", SIM_UNITS_EN).ratio(1)).toBe("off");
		expect(formattersFor("pl", SIM_UNITS_EN).ratio(0.5)).toBe("0,50");
	});

	it("renders translated unit templates with locale decimals", () => {
		const plUnits = { ...SIM_UNITS_EN, usd: "{n} $", hours: "{n} godz." };
		const fmt = formattersFor("pl", plUnits);

		expect(fmt.usd(1000.5)).toBe("1\u00a0000,50 $");
		expect(fmt.pct(1.5)).toBe("1,5%");
		expect(fmt.duration(5400)).toBe("1,5 godz.");
	});
});
