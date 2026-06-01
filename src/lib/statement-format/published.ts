export type PublishableEntry = {
	id: string;
	data: { draft: boolean };
};

export function excludeDrafts<T extends PublishableEntry>(entries: ReadonlyArray<T>): T[] {
	return entries.filter((e) => !e.data.draft);
}
