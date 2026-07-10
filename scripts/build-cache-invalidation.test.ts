/**
 * Contract test for package.json `scripts.build`.
 *
 * Astro's glob loader caches parsed content entries in `.astro/data-store.json`
 * keyed by file-content digest only. A schema change with unchanged content
 * files does NOT invalidate that cache, so `getEntry()/getCollection()` keep
 * returning data parsed by the *old* schema. A local `deploy:*` (which builds
 * on this machine) can then ship a stale/wrong parse to a live Worker — CI is
 * safe only because its checkout is fresh. See issue #39.
 *
 * `astro build --force` clears the content-layer + collection cache, forcing a
 * fresh parse under the current schema. All `deploy:*` scripts inherit this via
 * `pnpm run build`. Locking `--force` into a test prevents someone dropping it
 * and silently re-opening the stale-cache hole.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJson = JSON.parse(
	readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
) as { scripts?: Record<string, string> };

describe("package.json scripts.build", () => {
	const build = packageJson.scripts?.build;

	it("is defined", () => {
		expect(build).toBeDefined();
	});

	it("runs astro build", () => {
		expect(build).toMatch(/astro build/);
	});

	it("passes --force so a schema change can't reuse an older cached parse", () => {
		expect(build).toMatch(/--force/);
	});
});
