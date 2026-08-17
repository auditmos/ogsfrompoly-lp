import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput, StaticPage } from "./types";

function renderLoc(loc: string, lastmod?: string, alternateLinks: readonly string[] = []): string {
	const parts = ["<url>", `<loc>${loc}</loc>`];
	if (lastmod !== undefined) parts.push(`<lastmod>${lastmod}</lastmod>`);
	parts.push(...alternateLinks);
	parts.push("</url>");
	return parts.join("\n");
}

function renderStaticPage(page: StaticPage, siteUrl: string): string {
	// Only localized pages carry alternates (issue #75); English <url> blocks
	// render exactly as before, byte for byte.
	const alternateLinks = (page.alternates ?? []).map(
		(alternate) =>
			`<xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}"/>`,
	);
	return renderLoc(`${siteUrl}${page.path}`, page.lastmod, alternateLinks);
}

function renderUrl(entry: FeedEntry, siteUrl: string): string {
	return renderLoc(`${siteUrl}/${entry.collection}/${entry.slug}`, entry.date);
}

export function generateSitemap(input: FeedInput): string {
	const staticUrls = input.staticPages.map((p) => renderStaticPage(p, input.siteUrl));
	const entryUrls = sortEntries(input.entries).map((e) => renderUrl(e, input.siteUrl));
	const urls = [...staticUrls, ...entryUrls].join("\n");
	// The xhtml namespace appears only when something uses it, so an
	// alternate-free sitemap stays byte-identical to the pre-i18n output.
	const hasAlternates = input.staticPages.some((p) => (p.alternates?.length ?? 0) > 0);
	const urlsetTag = hasAlternates
		? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
		: '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
	return ['<?xml version="1.0" encoding="UTF-8"?>', urlsetTag, urls, "</urlset>", ""].join("\n");
}
