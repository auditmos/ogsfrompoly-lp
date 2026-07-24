import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import {
	findFullWalletAddresses,
	findRawWalletHex,
	findScaffoldingPhrases,
} from "./body-disclosure";
import { findPublishedInconsistencies, type StatementSanityInput } from "./statement-sanity";

const STATEMENTS_DIR = new URL("./statements/", import.meta.url).pathname;

interface StatementFile {
	file: string;
	/** Full file contents (frontmatter + body). */
	raw: string;
	/** Parsed YAML frontmatter. */
	data: Record<string, unknown>;
	/** Markdown body only, with the frontmatter block stripped. */
	body: string;
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function loadStatements(): StatementFile[] {
	const files = readdirSync(STATEMENTS_DIR).filter((f) => f.endsWith(".md"));
	return files.map((f) => {
		const raw = readFileSync(join(STATEMENTS_DIR, f), "utf8");
		const match = raw.match(FRONTMATTER);
		if (!match) {
			throw new Error(`${f}: expected a leading YAML frontmatter block`);
		}
		const [, frontmatter = "", body = ""] = match;
		const data = (YAML.parse(frontmatter) ?? {}) as Record<string, unknown>;
		return { file: f, raw, data, body };
	});
}

describe("statement markdown bodies", () => {
	const statements = loadStatements();

	it("contains at least one statement entry", () => {
		expect(statements.length).toBeGreaterThan(0);
	});

	it.each(statements)("$file contains no full EVM addresses (disclosure invariant)", ({ raw }) => {
		expect(findFullWalletAddresses(raw)).toEqual([]);
	});

	// Broader than the full-address check: catches truncated address fragments
	// too (e.g. `0x1214a9A2…`). The copytrading wallets must never appear in any
	// form; the site's only sanctioned reference is a `wallet_XXXX` truncated ID.
	it.each(statements)("$file contains no raw 0x wallet hex, full or truncated", ({ raw }) => {
		expect(findRawWalletHex(raw)).toEqual([]);
	});

	// Draft entries are exempt: they are never served (see statement-format/published.ts).
	// Every published statement, however, must be free of operator-facing scaffolding.
	const published = statements.filter((s) => s.data.draft !== true);

	it("has at least one published (non-draft) statement to lint", () => {
		expect(published.length).toBeGreaterThan(0);
	});

	it.each(published)("$file (draft:false) ships no operator scaffolding to readers", ({ body }) => {
		expect(findScaffoldingPhrases(body)).toEqual([]);
	});
});

describe("statement frontmatter sanity (ogsfrompoly-lp#30)", () => {
	const statements = loadStatements();

	// Drafts are exempt (findPublishedInconsistencies skips them), so upstream
	// producers can land a statement as draft and fix its numbers before flipping
	// it live. This is the flip-time gate that would have caught the PR #26 case.
	it("every published statement frontmatter is internally consistent", () => {
		const entries = statements.map((s) => ({
			file: s.file,
			draft: s.data.draft === true,
			data: s.data as unknown as StatementSanityInput,
		}));
		expect(findPublishedInconsistencies(entries)).toEqual([]);
	});
});
