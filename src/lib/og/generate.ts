import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { BRAND_CARD_MODEL, buildStatementCardModel, type CardModel } from "./card-model";
import { loadPublishedStatements } from "./load-statements";
import { OG_DEFAULT_IMAGE_PATH, ogImagePathForStatement } from "./paths";
import { renderCardPng } from "./render";

/**
 * Writes the social cards as static PNGs into the build output. Runs as a
 * post-build step in plain Node (via `scripts/generate-og-cards.ts`) rather than
 * a prerendered route — the Cloudflare adapter prerenders inside a workerd
 * sandbox that forbids runtime wasm compilation, which satori's rasterizer
 * needs. Output lands in `dist/og/**` alongside the other static assets and is
 * served by Cloudflare's asset handler, never on the Worker hot path.
 */

export interface GenerateOgCardsOptions {
	/** Build output root the PNGs are written under (the Cloudflare assets dir). */
	outDir: string;
	/** Directory of statement markdown files to discover cards from. */
	statementsDir: string;
}

/** Generates the default brand card plus one card per published statement. */
export async function generateOgCards(options: GenerateOgCardsOptions): Promise<string[]> {
	const statements = await loadPublishedStatements(options.statementsDir);

	const cards: { path: string; model: CardModel }[] = [
		{ path: OG_DEFAULT_IMAGE_PATH, model: BRAND_CARD_MODEL },
		...statements.map(({ slug, statement }) => ({
			path: ogImagePathForStatement(slug),
			model: buildStatementCardModel(statement),
		})),
	];

	const written: string[] = [];
	for (const card of cards) {
		const filePath = join(options.outDir, card.path);
		await mkdir(dirname(filePath), { recursive: true });
		await writeFile(filePath, await renderCardPng(card.model));
		written.push(card.path);
	}
	return written;
}
