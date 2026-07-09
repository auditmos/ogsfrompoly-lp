import { escapeCdata, escapeXml } from "./escape";
import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput } from "./types";

const SITE_LANGUAGE = "en";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

// pubDate/lastBuildDate are pinned to the entry's period_end at 00:00:00 GMT,
// not the actual publish moment (the Tue/3rd 14:00 UTC cadence). This is
// intentional: dates come from content, never the build clock, so the feed
// stays byte-deterministic (see determinism.test.ts).
function rfc822FromIsoDate(isoDate: string): string {
	const ts = Date.UTC(
		Number(isoDate.slice(0, 4)),
		Number(isoDate.slice(5, 7)) - 1,
		Number(isoDate.slice(8, 10)),
	);
	const d = new Date(ts);
	const day = DAY_NAMES[d.getUTCDay()];
	const month = MONTH_NAMES[d.getUTCMonth()];
	const date = String(d.getUTCDate()).padStart(2, "0");
	return `${day}, ${date} ${month} ${d.getUTCFullYear()} 00:00:00 GMT`;
}

function renderItem(entry: FeedEntry, siteUrl: string): string {
	const url = `${siteUrl}/${entry.collection}/${entry.slug}`;
	return [
		"<item>",
		`<title>${escapeXml(entry.title)}</title>`,
		`<link>${url}</link>`,
		`<guid isPermaLink="true">${url}</guid>`,
		`<pubDate>${rfc822FromIsoDate(entry.date)}</pubDate>`,
		`<description>${escapeXml(entry.summary)}</description>`,
		`<content:encoded><![CDATA[${escapeCdata(entry.body)}]]></content:encoded>`,
		"</item>",
	].join("\n");
}

export function generateRss(input: FeedInput): string {
	const sorted = sortEntries(input.entries);
	const items = sorted.map((e) => renderItem(e, input.siteUrl)).join("\n");
	// Derive lastBuildDate from the newest entry, not the build clock, so output
	// stays byte-deterministic (see determinism.test.ts). Omit it entirely when
	// the feed has no entries.
	const newest = sorted[0]?.date;
	const lastBuildDate =
		newest === undefined ? [] : [`<lastBuildDate>${rfc822FromIsoDate(newest)}</lastBuildDate>`];
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">',
		"<channel>",
		`<title>${escapeXml(input.siteTitle)}</title>`,
		`<link>${input.siteUrl}</link>`,
		`<description>${escapeXml(input.siteDescription)}</description>`,
		`<language>${SITE_LANGUAGE}</language>`,
		...lastBuildDate,
		`<atom:link href="${input.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>`,
		items,
		"</channel>",
		"</rss>",
		"",
	].join("\n");
}
