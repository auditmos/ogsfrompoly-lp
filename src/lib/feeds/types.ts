export type FeedEntry = {
	collection: string;
	slug: string;
	title: string;
	summary: string;
	date: string;
	body: string;
};

export type FeedInput = {
	siteUrl: string;
	siteTitle: string;
	siteDescription: string;
	entries: ReadonlyArray<FeedEntry>;
};
