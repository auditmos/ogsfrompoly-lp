/**
 * Reader-facing content for `/for-dummies/copy-cluster`, resolved per locale
 * through the Translation Catalog (issue #73).
 *
 * The prose is split into three markdown blocks so the HTML page can slot the
 * interactive simulator between them, while `clusterMarkdownFor` stitches the
 * same blocks into one self-contained document for the `.md` twin — with a
 * generated knob table standing in for the sliders, so the two surfaces can
 * never disagree about a default. All translatable text lives in
 * page-prose-en.ts / sim-prose-en.ts; the stitcher fills link targets and
 * config values (`{market}`, `{asOf}`, `{walletHref}`, `{hubHref}`,
 * `{methodologyHref}`) so they never enter the translation payload. The
 * wallet-copy link stays on the English route in every locale until issue #74
 * ships the localized target.
 */

import {
	type Locale,
	resolveClusterPage,
	resolveClusterSim,
	resolveSimUnits,
} from "@/i18n/catalog";
import { localeHref } from "@/i18n/routes";
import { fillTemplate, formattersFor } from "../locale-format";
import { CONFIG_AS_OF, CONFIG_MARKET, formatKnobValue, KNOBS, LIVE_CONFIG } from "./config";
import { type ClusterSimLocale, summarySentence } from "./simulator";

/** The serializable locale bundle the simulator speaks one language with. */
export function clusterSimFor(locale: Locale): ClusterSimLocale {
	return { locale, units: resolveSimUnits(locale), strings: resolveClusterSim(locale) };
}

export interface ClusterContent {
	readonly title: string;
	readonly description: string;
	readonly introMarkdown: string;
	readonly storyMarkdown: string;
	readonly closingMarkdown: string;
}

/** The three page blocks resolved for a locale, links and config filled in. */
export function clusterContentFor(locale: Locale): ClusterContent {
	const page = resolveClusterPage(locale);
	const sections = page.sections;
	const intro = fillTemplate(sections.intro, {
		// English route on purpose: the localized wallet walkthrough does not
		// exist until issue #74 — a same-locale URL here would be a dead link.
		walletHref: "/for-dummies/copy-wallet",
		hubHref: localeHref(locale, "/for-dummies"),
		market: CONFIG_MARKET,
		asOf: CONFIG_AS_OF,
	});
	const story = [
		sections.storyHeading,
		sections.step1,
		sections.step2,
		sections.step3,
		sections.step4,
		sections.step5,
		sections.step6,
		sections.step7,
		sections.step8,
		sections.step9,
		sections.step10,
		sections.step11,
		sections.step12,
		sections.step13,
		sections.step14,
	].join("\n\n");
	const closing = [
		sections.hardWired,
		sections.notClaiming,
		fillTemplate(sections.notThis, { methodologyHref: localeHref(locale, "/methodology") }),
	].join("\n\n");
	return {
		title: page.title,
		description: page.description,
		introMarkdown: `# ${page.title}\n\n${page.description}\n\n${intro}\n`,
		storyMarkdown: `${story}\n`,
		closingMarkdown: `${closing}\n`,
	};
}

/**
 * The knob table that replaces the interactive panel on the `.md` surface.
 * Generated from {@link KNOBS} so an added knob cannot go missing here.
 */
function renderKnobTable(locale: Locale): string {
	const page = resolveClusterPage(locale);
	const fmt = formattersFor(locale, resolveSimUnits(locale));
	const rows = KNOBS.map(
		(knob) =>
			`| ${page.knobs[knob.key] ?? knob.label} | \`${knob.key}\` | ${formatKnobValue(knob.unit, LIVE_CONFIG[knob.key], fmt)} |`,
	);
	return [
		`| ${page.md.tableRole} | ${page.md.tableKey} | ${fillTemplate(page.md.tableLive, { market: CONFIG_MARKET })} |`,
		"|---|---|---|",
		...rows,
		`| ${page.md.payoutLabel} | \`profit_destination\`, \`destination_allowlist\`, \`dust_threshold_usdc\` | ${page.md.notPublished} |`,
		`| ${page.md.killLabel} | \`kill_switch\` | — |`,
	].join("\n");
}

/** The `.md` twin for a locale — the same resolved strings as the HTML page. */
export function clusterMarkdownFor(locale: Locale): string {
	const page = resolveClusterPage(locale);
	const content = clusterContentFor(locale);
	return `${content.introMarkdown}
## ${page.md.inOneSentence}

> ${summarySentence(LIVE_CONFIG, clusterSimFor(locale))}

## ${page.md.knobsHeading}

${page.md.knobsBlurb}

${renderKnobTable(locale)}

${content.storyMarkdown}
${content.closingMarkdown}`;
}

const EN_CONTENT = clusterContentFor("en");

export const copyTradeTitle = EN_CONTENT.title;
export const copyTradeDescription = EN_CONTENT.description;
export const copyTradeIntroMarkdown = EN_CONTENT.introMarkdown;
export const copyTradeStoryMarkdown = EN_CONTENT.storyMarkdown;
export const copyTradeClosingMarkdown = EN_CONTENT.closingMarkdown;
export const copyTradeMarkdown = clusterMarkdownFor("en");
