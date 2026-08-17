import { type Locale, resolveMethodologyProse } from "@/i18n/catalog";
import { SOURCE_PAPERS } from "./citations";
import { METHODOLOGY_EN } from "./prose-en";

export const methodologyTitle = METHODOLOGY_EN.title;
export const methodologyDescription = METHODOLOGY_EN.description;

function formatAuthors(authors: readonly string[]): string {
	const [first, ...rest] = authors;
	if (first === undefined) return "";
	if (rest.length === 0) return first;
	const last = rest[rest.length - 1];
	if (last === undefined) return first;
	const head = [first, ...rest.slice(0, -1)].join(", ");
	return `${head}, & ${last}`;
}

function formatCitation(): string {
	return SOURCE_PAPERS.map((p) => `- ${formatAuthors(p.authors)} (${p.year}). *${p.title}*.`).join(
		"\n",
	);
}

/**
 * The methodology page markdown for a locale — the single string both the
 * HTML page and the `.md` twin render from, stitched from catalog-resolved
 * section keys. Translated locales carry the authority note right under the
 * description; the English surface never shows it. Citations are stitched in
 * verbatim — they are never translated.
 */
export function methodologyMarkdownFor(locale: Locale): string {
	const prose = resolveMethodologyProse(locale);
	const s = prose.sections;
	const parts = [
		`# ${prose.title}`,
		prose.description,
		...(locale === "en" ? [] : [`> ${prose.note}`]),
		s.intro,
		s.scope,
		s.qualify,
		s.skillTest,
		s.controls,
		s.scoring,
		s.skin,
		s.academicIntro,
		formatCitation(),
		s.academicOutro,
		s.disclosure,
		s.notThis,
	];
	return `${parts.join("\n\n")}\n`;
}

export const methodologyMarkdown = methodologyMarkdownFor("en");
