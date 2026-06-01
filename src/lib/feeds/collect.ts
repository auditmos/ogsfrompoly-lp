import { getCollection } from "astro:content";
import { excludeDrafts } from "@/lib/statement-format/published";
import type { FeedEntry, FeedInput } from "./types";

const SITE_URL = "https://ogsfrompoly.com";
const SITE_TITLE = "ogsfrompoly";
const SITE_DESCRIPTION = "We measure who is actually skilled on Polymarket.";

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

	return {
		siteUrl: SITE_URL,
		siteTitle: SITE_TITLE,
		siteDescription: SITE_DESCRIPTION,
		entries,
	};
}
