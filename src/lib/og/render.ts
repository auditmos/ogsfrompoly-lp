import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori, { type SatoriOptions } from "satori";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/site/meta";
import type { CardModel } from "./card-model";
import { cardToImageTree } from "./card-template";

/**
 * The raster boundary. Everything above it (`card-model`, `card-template`) is a
 * pure, unit-tested transform; this file owns the impure edges — reading font +
 * wasm binaries off disk, driving satori, and rasterizing with resvg. It runs
 * only in the post-build Node step (`scripts/generate-og-cards.ts`), never in
 * the Worker runtime bundle.
 */

const require = createRequire(import.meta.url);

// All-monospace card (matches the terminal/install-snippet brand voice). Weights
// mirror exactly what `card-template` asks for: 400 body, 500 stat values, 700
// titles. Sourced from the @fontsource dep — satori reads WOFF 1.0 natively.
const FONT_WEIGHTS = [400, 500, 700] as const;

function loadFont(weight: (typeof FONT_WEIGHTS)[number]): Buffer {
	return readFileSync(
		require.resolve(`@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${weight}-normal.woff`),
	);
}

let fonts: SatoriOptions["fonts"] | null = null;
function loadFonts(): SatoriOptions["fonts"] {
	if (!fonts) {
		fonts = FONT_WEIGHTS.map((weight) => ({
			name: "JetBrains Mono",
			data: loadFont(weight),
			weight,
			style: "normal",
		}));
	}
	return fonts;
}

let wasmReady: Promise<unknown> | null = null;
function ensureWasm(): Promise<unknown> {
	if (!wasmReady) {
		wasmReady = initWasm(readFileSync(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));
	}
	return wasmReady;
}

/** Rasterizes a card model to a 1200×630 PNG. */
export async function renderCardPng(model: CardModel): Promise<Uint8Array> {
	const svg = await satori(cardToImageTree(model) as Parameters<typeof satori>[0], {
		width: OG_IMAGE_WIDTH,
		height: OG_IMAGE_HEIGHT,
		fonts: loadFonts(),
	});

	await ensureWasm();
	return new Resvg(svg).render().asPng();
}
