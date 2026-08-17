import { hreflangAlternates, localeHref, switcherOptions, toLocale } from "./routes";

describe("toLocale", () => {
	it("passes known locales through and defaults everything else to en", () => {
		expect(toLocale("pl")).toBe("pl");
		expect(toLocale("es")).toBe("es");
		expect(toLocale("fr")).toBe("en");
		expect(toLocale(undefined)).toBe("en");
	});
});

describe("localeHref", () => {
	it("keeps English unprefixed at the root", () => {
		expect(localeHref("en", "")).toBe("/");
		expect(localeHref("en", "/methodology")).toBe("/methodology");
	});

	it("prefixes translated locales", () => {
		expect(localeHref("pl", "")).toBe("/pl");
		expect(localeHref("es", "")).toBe("/es");
		expect(localeHref("pl", "/methodology")).toBe("/pl/methodology");
		expect(localeHref("es", "/for-dummies")).toBe("/es/for-dummies");
	});
});

describe("hreflangAlternates", () => {
	it("emits one absolute alternate per locale plus x-default pointing at English", () => {
		expect(hreflangAlternates("https://ogsfrompoly.com", "")).toEqual([
			{ hreflang: "en", href: "https://ogsfrompoly.com/" },
			{ hreflang: "pl", href: "https://ogsfrompoly.com/pl" },
			{ hreflang: "es", href: "https://ogsfrompoly.com/es" },
			{ hreflang: "x-default", href: "https://ogsfrompoly.com/" },
		]);
	});

	it("carries the page path into every alternate", () => {
		const alternates = hreflangAlternates("https://ogsfrompoly.com", "/methodology");

		expect(alternates.map((a) => a.href)).toEqual([
			"https://ogsfrompoly.com/methodology",
			"https://ogsfrompoly.com/pl/methodology",
			"https://ogsfrompoly.com/es/methodology",
			"https://ogsfrompoly.com/methodology",
		]);
	});
});

describe("switcherOptions", () => {
	it("offers all three locales linking to the same page in each locale", () => {
		expect(switcherOptions("pl", "")).toEqual([
			{ locale: "en", label: "EN", href: "/", current: false },
			{ locale: "pl", label: "PL", href: "/pl", current: true },
			{ locale: "es", label: "ES", href: "/es", current: false },
		]);
	});

	it("marks the current locale on English pages", () => {
		const options = switcherOptions("en", "");

		expect(options.find((o) => o.locale === "en")?.current).toBe(true);
		expect(options.filter((o) => o.current)).toHaveLength(1);
	});
});
