import { getCollection } from "astro:content";
import { TRANSLATED_LOCALES } from "@/i18n/catalog";
import { hreflangAlternates, localeHref } from "@/i18n/routes";
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
	// Locale-relative paths of the pages published in all three locales; their
	// /pl and /es variants join the sitemap with hreflang alternates (issue
	// #75) while the English entries above render exactly as before. The
	// homepage's localized variants inherit its lastmod.
	const editorialPaths = [
		"",
		"/methodology",
		"/for-dummies",
		"/for-dummies/copy-cluster",
		"/for-dummies/copy-wallet",
	];
	const localizedPages: StaticPage[] = TRANSLATED_LOCALES.flatMap((locale) =>
		editorialPaths.map((path) => ({
			path: localeHref(locale, path),
			...(path === "" ? { lastmod: newest } : {}),
			alternates: hreflangAlternates(SITE_URL, path),
		})),
	);
	const staticPages: StaticPage[] = [
		{ path: "/", lastmod: newest },
		{ path: "/statements", lastmod: newest },
		{ path: "/methodology" },
		{ path: "/for-dummies" },
		{ path: "/for-dummies/copy-cluster" },
		{ path: "/for-dummies/copy-wallet" },
		...localizedPages,
	];

	return {
		siteUrl: SITE_URL,
		siteTitle: SITE_TITLE,
		siteDescription: SITE_DESCRIPTION,
		staticPages,
		entries,
	};
}
