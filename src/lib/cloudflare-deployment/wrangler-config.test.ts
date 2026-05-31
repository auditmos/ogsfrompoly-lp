import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Strips // line comments only. wrangler.jsonc uses no block comments;
// add /\* … \*\/ handling here if that changes.
function parseJsonc(text: string): unknown {
	return JSON.parse(text.replace(/^\s*\/\/.*$/gm, ""));
}

type WranglerConfig = {
	env: {
		production: {
			name: string;
			routes?: Array<{ pattern: string; custom_domain: boolean }>;
			vars?: Record<string, string>;
		};
	};
};

const wranglerPath = resolve(import.meta.dirname, "../../../wrangler.jsonc");
const config = parseJsonc(readFileSync(wranglerPath, "utf-8")) as WranglerConfig;

describe("wrangler.jsonc production env", () => {
	it("uses a dedicated production worker name", () => {
		expect(config.env.production.name).toBe("ogsfrompoly-lp-production");
	});

	it("binds ogsfrompoly.com via custom_domain (not zone_name routes)", () => {
		// Per .claude/rules/cloudflare-deployment.md: custom_domain auto-creates
		// DNS + SSL; zone_name + pattern requires a pre-existing proxied DNS record.
		const routes = config.env.production.routes;
		expect(routes).toBeDefined();
		expect(routes).toEqual([
			{
				pattern: "ogsfrompoly.com",
				custom_domain: true,
			},
		]);
	});

	it("declares CLOUDFLARE_WEB_ANALYTICS_TOKEN in production vars so the beacon can render", () => {
		expect(config.env.production.vars).toBeDefined();
		expect(config.env.production.vars).toHaveProperty("CLOUDFLARE_WEB_ANALYTICS_TOKEN");
	});
});
