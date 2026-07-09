import { type SortableStatementEntry, sortStatementsNewestFirst } from "./sort-newest-first";

export type StatementEntry = SortableStatementEntry;

/**
 * The newest statement, or `null` when there are none.
 *
 * Defined as the head of `sortStatementsNewestFirst` so "the latest one" and
 * "the top of the list" can never disagree — there is a single comparator
 * (`period_end` desc, `id` desc), not a re-implemented pick. See issue #38.
 */
export function pickLatestStatement<T extends StatementEntry>(entries: ReadonlyArray<T>): T | null {
	return sortStatementsNewestFirst(entries)[0] ?? null;
}
