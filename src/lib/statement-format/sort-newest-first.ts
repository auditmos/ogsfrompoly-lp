export type SortableStatementEntry = {
	id: string;
	data: { period_end: string };
};

/**
 * Returns a new array of statement entries sorted newest-to-oldest.
 *
 * Ordering: `period_end` descending, with `id` descending as a deterministic
 * tiebreaker. This same-date tiebreaker (slug/id descending) is the one
 * canonical order shared with the feeds (`feeds/sort.ts`), so a given pair of
 * entries lands in the same order on every surface — see issue #38. The head of
 * this list is also identical to `pickLatestStatement`'s result by construction.
 *
 * The input array is not mutated.
 */
export function sortStatementsNewestFirst<T extends SortableStatementEntry>(
	entries: ReadonlyArray<T>,
): T[] {
	return [...entries].sort((a, b) => {
		if (a.data.period_end !== b.data.period_end) {
			return a.data.period_end < b.data.period_end ? 1 : -1;
		}
		if (a.id !== b.id) {
			return a.id < b.id ? 1 : -1;
		}
		return 0;
	});
}
