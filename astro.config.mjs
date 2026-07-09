// @ts-check
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { SITE_URL } from "./src/lib/site/config.ts";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	// Canonical policy: no trailing slash (matches the feed URLs and buildPageMeta).
	// Kills the /statements/foo vs /statements/foo/ duplicate at the routing layer.
	trailingSlash: "never",
	output: "server",
	adapter: cloudflare(),
	vite: {
		plugins: [tailwindcss()],
	},
});
