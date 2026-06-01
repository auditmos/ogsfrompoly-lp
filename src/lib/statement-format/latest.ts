export type StatementEntry = {
	id: string;
	data: { period_end: string };
};

export function pickLatestStatement<T extends StatementEntry>(entries: ReadonlyArray<T>): T | null {
	let latest: T | null = null;
	for (const entry of entries) {
		if (!latest) {
			latest = entry;
			continue;
		}
		if (entry.data.period_end > latest.data.period_end) {
			latest = entry;
		} else if (entry.data.period_end === latest.data.period_end && entry.id > latest.id) {
			latest = entry;
		}
	}
	return latest;
}
