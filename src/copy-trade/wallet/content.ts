/**
 * Reader-facing content for `/for-dummies/copy-wallet`, resolved per locale
 * through the Translation Catalog (issue #74) — the same construction as the
 * cluster page.
 *
 * Three markdown blocks so the HTML page can slot the interactive panels
 * between them, while `walletMarkdownFor` stitches the same blocks into one
 * self-contained document for the `.md` twin — with a generated knob table
 * standing in for the sliders, so the two surfaces can never disagree about a
 * default. The stitcher fills link targets and config values (`{market}`,
 * `{asOf}`, `{clusterHref}`, `{hubHref}`, `{methodologyHref}`); the cluster
 * and hub links are same-locale because their localized pages exist.
 */

import { type Locale, resolveSimUnits, resolveWalletPage, resolveWalletSim } from "@/i18n/catalog";
import { localeHref } from "@/i18n/routes";
import { fillTemplate, formattersFor } from "../locale-format";
import {
	formatWalletKnobValue,
	WALLET_CONFIG_AS_OF,
	WALLET_CONFIG_MARKET,
	WALLET_KNOBS,
	WALLET_LIVE_CONFIG,
} from "./config";
import { type WalletSimLocale, walletSummarySentence } from "./simulator";

/** The serializable locale bundle the simulator speaks one language with. */
export function walletSimFor(locale: Locale): WalletSimLocale {
	return { locale, units: resolveSimUnits(locale), strings: resolveWalletSim(locale) };
}

export interface WalletContent {
	readonly title: string;
	readonly description: string;
	readonly introMarkdown: string;
	readonly storyMarkdown: string;
	readonly closingMarkdown: string;
}

/** The three page blocks resolved for a locale, links and config filled in. */
export function walletContentFor(locale: Locale): WalletContent {
	const page = resolveWalletPage(locale);
	const sections = page.sections;
	const clusterHref = localeHref(locale, "/for-dummies/copy-cluster");
	const intro = fillTemplate(sections.intro, {
		clusterHref,
		hubHref: localeHref(locale, "/for-dummies"),
		market: WALLET_CONFIG_MARKET,
		asOf: WALLET_CONFIG_AS_OF,
	});
	const story = [
		sections.storyHeading,
		fillTemplate(sections.step1, { clusterHref }),
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
 * The knob table that replaces the interactive panels on the `.md` surface.
 * Generated from {@link WALLET_KNOBS} so an added knob cannot go missing here.
 */
function renderKnobTable(locale: Locale): string {
	const page = resolveWalletPage(locale);
	const fmt = formattersFor(locale, resolveSimUnits(locale));
	const rows = WALLET_KNOBS.map(
		(knob) =>
			`| ${page.knobs[knob.key] ?? knob.label} | \`${knob.yamlKey}\` | ${formatWalletKnobValue(knob.unit, WALLET_LIVE_CONFIG[knob.key], fmt)} |`,
	);
	return [
		`| ${page.md.tableRole} | ${page.md.tableKey} | ${fillTemplate(page.md.tableLive, { market: WALLET_CONFIG_MARKET })} |`,
		"|---|---|---|",
		...rows,
		`| ${page.md.gasLabel} | \`gas_reserve_pol\` | 2 POL |`,
		`| ${page.md.payoutLabel} | \`profit_destination\`, \`destination_allowlist\`, \`dust_threshold_usdc\` | ${page.md.notPublished} |`,
		`| ${page.md.killLabel} | \`kill_switch\` | — |`,
	].join("\n");
}

/** The `.md` twin for a locale — the same resolved strings as the HTML page. */
export function walletMarkdownFor(locale: Locale): string {
	const page = resolveWalletPage(locale);
	const content = walletContentFor(locale);
	return `${content.introMarkdown}
## ${page.md.inOneSentence}

> ${walletSummarySentence(WALLET_LIVE_CONFIG, walletSimFor(locale))}

## ${page.md.knobsHeading}

${page.md.knobsBlurb}

${renderKnobTable(locale)}

${content.storyMarkdown}
${content.closingMarkdown}`;
}

const EN_CONTENT = walletContentFor("en");

export const walletCopyTitle = EN_CONTENT.title;
export const walletCopyDescription = EN_CONTENT.description;
export const walletCopyIntroMarkdown = EN_CONTENT.introMarkdown;
export const walletCopyStoryMarkdown = EN_CONTENT.storyMarkdown;
export const walletCopyClosingMarkdown = EN_CONTENT.closingMarkdown;
export const walletCopyMarkdown = walletMarkdownFor("en");
