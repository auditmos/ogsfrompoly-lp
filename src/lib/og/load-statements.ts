import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { asStatementData, type Statement } from "@/lib/statement-format/statement-data";

/**
 * Reads statements straight from markdown at build time. Card generation runs in
 * an `astro:build:done` integration (Node, so satori + wasm work) rather than in
 * a prerendered route (workerd sandbox, where runtime wasm compilation is
 * disallowed) — so it cannot use `getCollection` and parses frontmatter itself.
 * `asStatementData` is still the one schema guard, so cards can never disagree
 * with the pages about what a statement is.
 */

export interface LoadedStatement {
	slug: string;
	statement: Statement;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Extracts and schema-validates a statement's frontmatter; `null` if absent or invalid. */
export function parseStatementFrontmatter(raw: string): Statement | null {
	const match = FRONTMATTER.exec(raw);
	if (!match) return null;
	return asStatementData(parseYaml(match[1]));
}

/** Loads every published (non-draft) statement in a directory, keyed by file slug. */
export async function loadPublishedStatements(dir: string): Promise<LoadedStatement[]> {
	const files = (await readdir(dir)).filter((name) => name.endsWith(".md"));
	const loaded: LoadedStatement[] = [];
	for (const file of files) {
		const statement = parseStatementFrontmatter(await readFile(join(dir, file), "utf8"));
		if (statement && !statement.draft) {
			loaded.push({ slug: file.replace(/\.md$/, ""), statement });
		}
	}
	return loaded;
}
