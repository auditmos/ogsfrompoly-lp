import { type SortableStatementEntry, sortStatementsNewestFirst } from "./sort-newest-first";

describe("sortStatementsNewestFirst", () => {
	it("returns an empty array for empty input", () => {
		expect(sortStatementsNewestFirst([])).toEqual([]);
	});

	it("returns a single-entry array unchanged", () => {
		const only: SortableStatementEntry = {
			id: "2026-05-25-only",
			data: { period_end: "2026-05-25" },
		};
		expect(sortStatementsNewestFirst([only])).toEqual([only]);
	});

	it("orders entries newest period_end first across distinct dates", () => {
		const entries: SortableStatementEntry[] = [
			{ id: "2026-04-12-april-w2", data: { period_end: "2026-04-12" } },
			{ id: "2026-05-25-may-w4", data: { period_end: "2026-05-25" } },
			{ id: "2026-05-04-may-w1", data: { period_end: "2026-05-04" } },
		];

		expect(sortStatementsNewestFirst(entries).map((e) => e.id)).toEqual([
			"2026-05-25-may-w4",
			"2026-05-04-may-w1",
			"2026-04-12-april-w2",
		]);
	});

	it("breaks ties on equal period_end by larger id regardless of input order", () => {
		const aardvark: SortableStatementEntry = {
			id: "2026-05-25-aardvark",
			data: { period_end: "2026-05-25" },
		};
		const zebra: SortableStatementEntry = {
			id: "2026-05-25-zebra",
			data: { period_end: "2026-05-25" },
		};

		expect(sortStatementsNewestFirst([aardvark, zebra]).map((e) => e.id)).toEqual([
			"2026-05-25-zebra",
			"2026-05-25-aardvark",
		]);
		expect(sortStatementsNewestFirst([zebra, aardvark]).map((e) => e.id)).toEqual([
			"2026-05-25-zebra",
			"2026-05-25-aardvark",
		]);
	});

	it("does not mutate the input array", () => {
		const entries: SortableStatementEntry[] = [
			{ id: "a", data: { period_end: "2026-04-12" } },
			{ id: "b", data: { period_end: "2026-05-25" } },
		];
		const snapshot = entries.map((e) => e.id);
		sortStatementsNewestFirst(entries);
		expect(entries.map((e) => e.id)).toEqual(snapshot);
	});
});
