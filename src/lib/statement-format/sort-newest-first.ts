export type SortableStatementEntry = {
	id: string;
	data: { period_end: string };
};

/**
 * Returns a new array of statement entries sorted newest-to-oldest.
 *
 * Ordering: `period_end` descending, with `id` descending as a deterministic
 * tiebreaker. Matches the selection logic in `pickLatestStatement` so the
 * head of this list is identical to `pickLatestStatement`'s result.
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
