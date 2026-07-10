export type OpenGraphType = "website" | "article";

/**
 * Open Graph card dimensions. The one source of truth for the 1.91:1 unfurl
 * aspect ratio — `buildPageMeta` emits these as `og:image:*` and the card
 * renderer rasterizes at exactly this size.
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type PageMetaInput = {
	site: string | URL;
	path: string;
	title: string;
	description: string;
	type?: OpenGraphType;
	/**
	 * Root-relative path (or absolute URL) of the social card image. When given,
	 * `buildPageMeta` emits `og:image`/`twitter:image` and upgrades the Twitter
	 * card to `summary_large_image`. Omit for pages that have no designed card.
	 */
	image?: string;
};

export type PageMeta = {
	canonical: string;
	og: Record<string, string>;
	twitter: Record<string, string>;
};

export function buildPageMeta(input: PageMetaInput): PageMeta {
	const origin = String(input.site).replace(/\/+$/, "");
	const path = input.path.replace(/\/+$/, "");
	const canonical = path === "" ? `${origin}/` : `${origin}${path}`;
	const type = input.type ?? "website";

	const og: Record<string, string> = {
		"og:title": input.title,
		"og:description": input.description,
		"og:type": type,
		"og:url": canonical,
	};

	const twitter: Record<string, string> = {
		"twitter:card": "summary",
		"twitter:title": input.title,
		"twitter:description": input.description,
	};

	if (input.image !== undefined) {
		const image = toAbsolute(origin, input.image);
		og["og:image"] = image;
		og["og:image:width"] = String(OG_IMAGE_WIDTH);
		og["og:image:height"] = String(OG_IMAGE_HEIGHT);
		twitter["twitter:image"] = image;
		twitter["twitter:card"] = "summary_large_image";
	}

	return { canonical, og, twitter };
}

/**
 * Resolves a card image reference to an absolute URL. A root-relative path is
 * joined onto the (already trailing-slash-normalized) origin; a value that is
 * already an absolute URL is passed through unchanged, so callers can point at
 * an off-origin CDN if one ever appears.
 */
function toAbsolute(origin: string, image: string): string {
	if (/^https?:\/\//i.test(image)) return image;
	return `${origin}${image.startsWith("/") ? image : `/${image}`}`;
}
