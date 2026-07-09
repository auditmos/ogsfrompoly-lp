import type { FeedEntry } from "./types";

/**
 * The canonical feed order, shared by RSS, llms.txt, and the sitemap.
 *
 * Same-date entries use the same tiebreaker as the statements surface
 * (`sortStatementsNewestFirst`): **slug descending**, so a given pair of
 * entries lands in the same order on every surface (issue #38 AC3). The
 * `collection` grouping only fires across collections (never among statements),
 * keeping cross-collection output deterministic without disturbing that.
 *
 * Order: `date` desc → `collection` asc → `slug` desc.
 */
export function sortEntries(entries: ReadonlyArray<FeedEntry>): FeedEntry[] {
	return [...entries].sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? 1 : -1;
		if (a.collection !== b.collection) return a.collection < b.collection ? -1 : 1;
		if (a.slug === b.slug) return 0;
		return a.slug < b.slug ? 1 : -1;
	});
}
