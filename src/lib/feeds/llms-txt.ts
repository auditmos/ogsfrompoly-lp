import { copyTradeDescription, copyTradeTitle } from "@/copy-trade/cluster/content";
import { forDummiesDescription, forDummiesTitle } from "@/copy-trade/hub-content";
import { walletCopyDescription, walletCopyTitle } from "@/copy-trade/wallet/content";
import {
	resolveClusterPage,
	resolveHubProse,
	resolveMethodologyProse,
	resolveWalletPage,
	TRANSLATED_LOCALES,
	type TranslatedLocale,
} from "@/i18n/catalog";
import { localeHref } from "@/i18n/routes";
import { methodologyDescription, methodologyTitle } from "@/methodology/content";
import { sortEntries } from "./sort";
import type { FeedEntry, FeedInput } from "./types";

/**
 * Hand-authored pages that are not content-collection entries but still have a
 * `.md` twin worth advertising to agents. Titles and summaries are imported from
 * the page modules rather than restated here, so a rewritten page description
 * cannot silently drift away from what `llms.txt` promises.
 *
 * Section order is declaration order, and all of them render ahead of the
 * per-collection sections.
 */
interface StaticDoc {
	readonly section: string;
	readonly title: string;
	/** Path of the `.md` twin, relative to the site root. */
	readonly path: string;
	readonly summary: string;
}

const STATIC_DOCS: readonly StaticDoc[] = [
	{
		section: "Browse all",
		title: "All statements",
		path: "/statements.md",
		summary:
			"Index of every published statement — weekly track record and monthly project P&L, newest first.",
	},
	{
		section: "Methodology",
		title: methodologyTitle,
		path: "/methodology.md",
		summary: methodologyDescription,
	},
	{
		section: "Copy trade",
		title: forDummiesTitle,
		path: "/for-dummies.md",
		summary: forDummiesDescription,
	},
	{
		section: "Copy trade",
		title: copyTradeTitle,
		path: "/for-dummies/copy-cluster.md",
		summary: copyTradeDescription,
	},
	{
		section: "Copy trade",
		title: walletCopyTitle,
		path: "/for-dummies/copy-wallet.md",
		summary: walletCopyDescription,
	},
];

/**
 * The translated `.md` twins, one section per language (issue #75). Titles
 * and summaries resolve through the same Translation Catalog the pages render
 * from — never restated — so a retranslated page cannot drift away from what
 * `llms.txt` promises. Each language lists its four translated editorial
 * twins: methodology, the chooser hub, and the two bot walkthroughs.
 */
const LOCALE_SECTION_TITLES: Record<TranslatedLocale, string> = {
	pl: "Polski",
	es: "Español",
};

function localizedDocs(locale: TranslatedLocale): StaticDoc[] {
	const section = LOCALE_SECTION_TITLES[locale];
	const methodology = resolveMethodologyProse(locale);
	const hub = resolveHubProse(locale);
	const cluster = resolveClusterPage(locale);
	const wallet = resolveWalletPage(locale);
	return [
		{
			section,
			title: methodology.title,
			path: `${localeHref(locale, "/methodology")}.md`,
			summary: methodology.description,
		},
		{
			section,
			title: hub.title,
			path: `${localeHref(locale, "/for-dummies")}.md`,
			summary: hub.description,
		},
		{
			section,
			title: cluster.title,
			path: `${localeHref(locale, "/for-dummies/copy-cluster")}.md`,
			summary: cluster.description,
		},
		{
			section,
			title: wallet.title,
			path: `${localeHref(locale, "/for-dummies/copy-wallet")}.md`,
			summary: wallet.description,
		},
	];
}

const ALL_DOCS: readonly StaticDoc[] = [
	...STATIC_DOCS,
	...TRANSLATED_LOCALES.flatMap((locale) => localizedDocs(locale)),
];

function renderLine(entry: FeedEntry, siteUrl: string): string {
	const url = `${siteUrl}/${entry.collection}/${entry.slug}.md`;
	return `- [${entry.title}](${url}): ${entry.summary}`;
}

function renderStaticSections(siteUrl: string): string[] {
	const sections = [...new Set(ALL_DOCS.map((doc) => doc.section))];
	return sections.flatMap((section) => [
		`## ${section}`,
		"",
		...ALL_DOCS.filter((doc) => doc.section === section).map(
			(doc) => `- [${doc.title}](${siteUrl}${doc.path}): ${doc.summary}`,
		),
		"",
	]);
}

export function generateLlmsTxt(input: FeedInput): string {
	const sorted = sortEntries(input.entries);
	const collections = [...new Set(sorted.map((e) => e.collection))].sort();
	const sections = collections.map((collection) => {
		const rows = sorted
			.filter((e) => e.collection === collection)
			.map((e) => renderLine(e, input.siteUrl))
			.join("\n");
		return `## ${collection}\n\n${rows}`;
	});

	return [
		`# ${input.siteTitle}`,
		"",
		`> ${input.siteDescription}`,
		"",
		...renderStaticSections(input.siteUrl),
		...sections,
		"",
	].join("\n");
}
