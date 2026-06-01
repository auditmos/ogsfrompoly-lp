import { pickLatestStatement, type StatementEntry } from "./latest";

describe("pickLatestStatement", () => {
	it("picks the entry with the most recent period_end", () => {
		const entries: StatementEntry[] = [
			{ id: "2026-04-12-april-w2", data: { period_end: "2026-04-12" } },
			{ id: "2026-05-25-may-w4", data: { period_end: "2026-05-25" } },
			{ id: "2026-05-04-may-w1", data: { period_end: "2026-05-04" } },
		];

		expect(pickLatestStatement(entries)?.id).toBe("2026-05-25-may-w4");
	});

	it("returns null when the collection is empty", () => {
		expect(pickLatestStatement([])).toBeNull();
	});

	it("returns the only entry when the collection has one", () => {
		const only = { id: "2026-05-25-only", data: { period_end: "2026-05-25" } };
		expect(pickLatestStatement([only])).toBe(only);
	});

	it("breaks ties on equal period_end by larger slug regardless of input order", () => {
		const a = { id: "2026-05-25-aardvark", data: { period_end: "2026-05-25" } };
		const z = { id: "2026-05-25-zebra", data: { period_end: "2026-05-25" } };

		expect(pickLatestStatement([a, z])?.id).toBe("2026-05-25-zebra");
		expect(pickLatestStatement([z, a])?.id).toBe("2026-05-25-zebra");
	});
});
