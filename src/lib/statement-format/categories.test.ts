import { formatCategoryList } from "./categories";

describe("formatCategoryList", () => {
	it("title-cases a single category", () => {
		expect(formatCategoryList(["politics"])).toBe("Politics");
	});

	it("joins multiple categories with middle dots", () => {
		expect(formatCategoryList(["politics", "crypto"])).toBe("Politics · Crypto");
	});

	it("preserves the input order (schema-defined emphasis order)", () => {
		expect(formatCategoryList(["crypto", "politics", "macro-finance"])).toBe(
			"Crypto · Politics · Macro-Finance",
		);
	});

	it("title-cases each hyphen-separated word in compound categories", () => {
		expect(formatCategoryList(["macro-finance"])).toBe("Macro-Finance");
	});
});
