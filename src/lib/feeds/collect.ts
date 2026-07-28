import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site/config";
import { excludeDrafts } from "@/lib/statement-format/published";
import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput, StaticPage } from "./types";

export async function collectFeedInput(): Promise<FeedInput> {
	const statements = excludeDrafts(await getCollection("statements"));
	const entries: FeedEntry[] = statements.map((entry) => ({
		collection: "statements",
		slug: entry.id,
		title: entry.data.title,
		summary: entry.data.summary,
		date: entry.data.period_end,
		body: entry.body ?? "",
	}));

	// The homepage and the statements index both reflect the newest published
	// entry, so we date them by it; the methodology and for-dummies pages are
	// content-stable so they carry no lastmod. Deriving from entry data (not build
	// time) keeps the sitemap byte-deterministic — see determinism.test.ts.
	const newest = sortEntries(entries)[0]?.date;
	const staticPages: StaticPage[] = [
		{ path: "/", lastmod: newest },
		{ path: "/statements", lastmod: newest },
		{ path: "/methodology" },
		{ path: "/for-dummies" },
	];

	return {
		siteUrl: SITE_URL,
		siteTitle: SITE_TITLE,
		siteDescription: SITE_DESCRIPTION,
		staticPages,
		entries,
	};
}
