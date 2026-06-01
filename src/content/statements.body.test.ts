import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findFullWalletAddresses } from "./body-disclosure";

const STATEMENTS_DIR = new URL("./statements/", import.meta.url).pathname;

function loadStatementBodies(): Array<{ file: string; body: string }> {
	const files = readdirSync(STATEMENTS_DIR).filter((f) => f.endsWith(".md"));
	return files.map((f) => ({
		file: f,
		body: readFileSync(join(STATEMENTS_DIR, f), "utf8"),
	}));
}

describe("statement markdown bodies", () => {
	const bodies = loadStatementBodies();

	it("contains at least one statement entry", () => {
		expect(bodies.length).toBeGreaterThan(0);
	});

	it.each(bodies)("$file contains no full EVM addresses (disclosure invariant)", ({ body }) => {
		const matches = findFullWalletAddresses(body);
		expect(matches).toEqual([]);
	});
});
