export function statementHref(slug: string): string {
	const normalized = slug.startsWith("/") ? slug.slice(1) : slug;
	return `/statements/${normalized}`;
}
