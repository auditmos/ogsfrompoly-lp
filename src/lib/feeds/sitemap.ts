import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput, StaticPage } from "./types";

function renderLoc(loc: string, lastmod?: string): string {
	const parts = ["<url>", `<loc>${loc}</loc>`];
	if (lastmod !== undefined) parts.push(`<lastmod>${lastmod}</lastmod>`);
	parts.push("</url>");
	return parts.join("\n");
}

function renderStaticPage(page: StaticPage, siteUrl: string): string {
	return renderLoc(`${siteUrl}${page.path}`, page.lastmod);
}

function renderUrl(entry: FeedEntry, siteUrl: string): string {
	return renderLoc(`${siteUrl}/${entry.collection}/${entry.slug}`, entry.date);
}

export function generateSitemap(input: FeedInput): string {
	const staticUrls = input.staticPages.map((p) => renderStaticPage(p, input.siteUrl));
	const entryUrls = sortEntries(input.entries).map((e) => renderUrl(e, input.siteUrl));
	const urls = [...staticUrls, ...entryUrls].join("\n");
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		"</urlset>",
		"",
	].join("\n");
}
