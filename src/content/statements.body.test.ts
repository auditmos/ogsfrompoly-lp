import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { findFullWalletAddresses, findScaffoldingPhrases } from "./body-disclosure";

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
