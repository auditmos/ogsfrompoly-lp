import { statementHref } from "./href";

describe("statementHref", () => {
	it("prepends '/statements/' to a slug", () => {
		expect(statementHref("2026-05-25-placeholder")).toBe("/statements/2026-05-25-placeholder");
	});

	it("strips a leading slash on the input slug", () => {
		expect(statementHref("/2026-05-25-foo")).toBe("/statements/2026-05-25-foo");
	});
});
