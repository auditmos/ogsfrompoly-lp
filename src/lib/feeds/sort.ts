import type { FeedEntry } from "./types";

export function sortEntries(entries: ReadonlyArray<FeedEntry>): FeedEntry[] {
	return [...entries].sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? 1 : -1;
		if (a.collection !== b.collection) return a.collection < b.collection ? -1 : 1;
		if (a.slug === b.slug) return 0;
		return a.slug < b.slug ? -1 : 1;
	});
}
