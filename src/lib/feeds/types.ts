export type FeedEntry = {
	collection: string;
	slug: string;
	title: string;
	summary: string;
	date: string;
	body: string;
};

export type StaticPage = {
	path: string;
	lastmod?: string;
	/** hreflang alternates, present only on localized pages (issue #75). */
	alternates?: ReadonlyArray<{ hreflang: string; href: string }>;
};

export type FeedInput = {
	siteUrl: string;
	siteTitle: string;
	siteDescription: string;
	entries: ReadonlyArray<FeedEntry>;
	staticPages: ReadonlyArray<StaticPage>;
};
