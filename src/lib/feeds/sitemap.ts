import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput } from "./types";

function renderUrl(entry: FeedEntry, siteUrl: string): string {
	const loc = `${siteUrl}/${entry.collection}/${entry.slug}`;
	return ["<url>", `<loc>${loc}</loc>`, `<lastmod>${entry.date}</lastmod>`, "</url>"].join("\n");
}

export function generateSitemap(input: FeedInput): string {
	const urls = sortEntries(input.entries)
		.map((e) => renderUrl(e, input.siteUrl))
		.join("\n");
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		"</urlset>",
		"",
	].join("\n");
}
