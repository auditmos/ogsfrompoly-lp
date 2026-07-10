#!/usr/bin/env tsx
/**
 * Post-build step: rasterize the Open Graph social cards into the build output.
 *
 * Runs after `astro build` (see the `build` npm script) in plain Node so satori
 * + resvg-wasm can rasterize — a prerendered route can't, because the Cloudflare
 * adapter runs those in a workerd sandbox that forbids runtime wasm compilation.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOgCards } from "@/lib/og/generate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The @astrojs/cloudflare adapter serves static assets from dist/client (the
// worker lives in dist/server) — cards must land there to be served as assets.
const written = await generateOgCards({
	outDir: path.join(ROOT, "dist", "client"),
	statementsDir: path.join(ROOT, "src", "content", "statements"),
});

console.log(`✓ generated ${written.length} social card(s) → dist/client/og/`);
for (const cardPath of written) console.log(`  ${cardPath}`);
