import { excludeDrafts, type PublishableEntry } from "./published";

const live: PublishableEntry = { id: "2026-05-25-live", data: { draft: false } };
const draft: PublishableEntry = { id: "2026-05-25-placeholder", data: { draft: true } };

describe("excludeDrafts", () => {
	it("returns an empty array when given an empty array", () => {
		expect(excludeDrafts([])).toEqual([]);
	});

	it("keeps entries whose draft flag is false", () => {
		expect(excludeDrafts([live])).toEqual([live]);
	});

	it("drops entries whose draft flag is true", () => {
		expect(excludeDrafts([live, draft])).toEqual([live]);
	});

	it("preserves input order among kept entries", () => {
		const a: PublishableEntry = { id: "a", data: { draft: false } };
		const b: PublishableEntry = { id: "b", data: { draft: true } };
		const c: PublishableEntry = { id: "c", data: { draft: false } };
		expect(excludeDrafts([a, b, c]).map((e) => e.id)).toEqual(["a", "c"]);
	});
});
