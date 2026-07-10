/**
 * Root-relative URLs for the social card images, defined once here so the
 * prerendered `/og/**.png` endpoint and the pages that reference the cards can
 * never disagree on a path. `buildPageMeta` resolves these to absolute URLs.
 */

/** The static brand card used by every non-statement page. */
export const OG_DEFAULT_IMAGE_PATH = "/og/default.png";

/** The per-statement card path for a given statement slug. */
export function ogImagePathForStatement(slug: string): string {
	const normalized = slug.startsWith("/") ? slug.slice(1) : slug;
	return `/og/statements/${normalized}.png`;
}
