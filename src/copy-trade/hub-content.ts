/**
 * Reader-facing content for the `/for-dummies` chooser — the small hub that
 * routes readers to the right bot's walkthrough.
 *
 * The cards and the comparison rows are data, not prose, and both surfaces
 * (the HTML page and the `.md` twin) render from the same locale-resolved
 * arrays, so the two can never disagree about what either bot does. All
 * translatable leaves live in hub-prose-en.ts and resolve through the
 * Translation Catalog; structural fields (ids, eyebrows, link targets) never
 * enter the translation payload.
 */

import { type Locale, resolveHubProse } from "@/i18n/catalog";
import { localeHref } from "@/i18n/routes";
import { HUB_EN } from "./hub-prose-en";

export const forDummiesTitle = HUB_EN.title;
export const forDummiesDescription = HUB_EN.description;

interface BotFact {
	readonly label: string;
	readonly value: string;
}

export interface BotCard {
	readonly id: "cluster" | "wallet";
	/** Small mono line above the name, e.g. `"bot 01 · cluster copy"`. */
	readonly eyebrow: string;
	/** The friendly name, e.g. `"Copy the crowd"`. */
	readonly name: string;
	/** One-paragraph ELI5 of the whole idea. */
	readonly tagline: string;
	readonly href: string;
	/** The `.md` twin, for agents and feed readers. */
	readonly mdHref: string;
	readonly facts: readonly BotFact[];
}

export interface CompareRow {
	readonly label: string;
	readonly cluster: string;
	readonly wallet: string;
}

/** Everything either hub surface needs for one locale, arrays preserved. */
export interface HubModel {
	readonly title: string;
	readonly description: string;
	readonly eyebrow: string;
	readonly heading: string;
	readonly choose: string;
	readonly read: string;
	readonly sideBySide: string;
	readonly sharedNote: string;
	readonly adviceLead: string;
	readonly adviceLink: string;
	readonly methodologyHref: string;
	readonly cards: readonly BotCard[];
	readonly rows: readonly CompareRow[];
}

// `localized` marks a walkthrough that ships /pl and /es pages: its card links
// same-locale. The wallet page has no localized variants until issue #74, so
// its card keeps the live English page rather than a dead same-locale URL.
const CARD_STATIC = [
	{
		id: "cluster",
		eyebrow: "bot 01 · cluster copy",
		path: "/for-dummies/copy-cluster",
		localized: true,
	},
	{
		id: "wallet",
		eyebrow: "bot 02 · wallet copy",
		path: "/for-dummies/copy-wallet",
		localized: false,
	},
] as const;

const COMPARE_ORDER = ["signal", "guard", "fees", "exit", "money", "liveSince"] as const;

/** The hub resolved for a locale, card links per `CARD_STATIC.localized`. */
export function hubFor(locale: Locale): HubModel {
	const prose = resolveHubProse(locale);
	const cards: BotCard[] = CARD_STATIC.map((entry) => {
		const bot = prose[entry.id];
		const href = entry.localized ? localeHref(locale, entry.path) : entry.path;
		return {
			id: entry.id,
			eyebrow: entry.eyebrow,
			name: bot.name,
			tagline: bot.tagline,
			href,
			mdHref: `${href}.md`,
			facts: [
				{ label: prose.facts.follows, value: bot.follows },
				{ label: prose.facts.fires, value: bot.fires },
				{ label: prose.facts.leaves, value: bot.leaves },
				{ label: prose.facts.ticket, value: bot.ticket },
			],
		};
	});
	return {
		title: prose.title,
		description: prose.description,
		eyebrow: prose.eyebrow,
		heading: prose.heading,
		choose: prose.choose,
		read: prose.read,
		sideBySide: prose.sideBySide,
		sharedNote: prose.sharedNote,
		adviceLead: prose.advice.lead,
		adviceLink: prose.advice.link,
		methodologyHref: localeHref(locale, "/methodology"),
		cards,
		rows: COMPARE_ORDER.map((key) => prose.compare[key]),
	};
}

function renderCardSection(card: BotCard, mdRead: string): string[] {
	return [
		`## ${card.name} — ${card.eyebrow.split("·")[1]?.trim() ?? card.id}`,
		"",
		card.tagline,
		"",
		...card.facts.map((fact) => `- **${fact.label}**: ${fact.value}`),
		"",
		mdRead
			.replace("{href}", `[${card.href}](${card.href})`)
			.replace("{mdHref}", `[${card.mdHref}](${card.mdHref})`),
		"",
	];
}

function renderCompareTable(rows: readonly CompareRow[]): string {
	return [
		"| | Cluster copy | Wallet copy |",
		"|---|---|---|",
		...rows.map((row) => `| ${row.label} | ${row.cluster} | ${row.wallet} |`),
	].join("\n");
}

/**
 * The hub `.md` twin for a locale — stitched from the identical resolved
 * strings the HTML page renders, plus the twin-only link sentences.
 */
export function forDummiesMarkdownFor(locale: Locale): string {
	const prose = resolveHubProse(locale);
	const hub = hubFor(locale);
	return `# ${hub.title}

${hub.description}

${hub.cards.flatMap((card) => renderCardSection(card, prose.mdRead)).join("\n")}
## ${hub.sideBySide}

${renderCompareTable(hub.rows)}

${hub.sharedNote}

${prose.advice.md.replace("{methodologyHref}", hub.methodologyHref)}
`;
}

export const forDummiesMarkdown = forDummiesMarkdownFor("en");

export const BOT_CARDS: readonly BotCard[] = hubFor("en").cards;

export const COMPARE_ROWS: readonly CompareRow[] = hubFor("en").rows;
