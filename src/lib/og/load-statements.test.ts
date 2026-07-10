import { parseStatementFrontmatter } from "./load-statements";

const WEEKLY = `---
schema_version: 1
type: weekly
title: "Skilled wallets held the line"
summary: "A weekly statement."
period_start: 2026-05-25
period_end: 2026-05-31
bankroll_usd: 10000
alert_count: 12
hit_rate: 0.64
hypothetical_pnl_usd: 1240
categories:
  - politics
top_wallets: []
---

Body copy that must be ignored.
`;

describe("parseStatementFrontmatter", () => {
	it("parses a valid statement's frontmatter into a typed statement", () => {
		const statement = parseStatementFrontmatter(WEEKLY);

		expect(statement).not.toBeNull();
		expect(statement?.type).toBe("weekly");
		expect(statement?.title).toBe("Skilled wallets held the line");
		expect(statement?.hit_rate).toBe(0.64);
	});

	it("normalizes YAML dates to ISO strings via the schema", () => {
		const statement = parseStatementFrontmatter(WEEKLY);

		expect(statement?.period_start).toBe("2026-05-25");
		expect(statement?.period_end).toBe("2026-05-31");
	});

	it("returns null when the file has no frontmatter block", () => {
		expect(parseStatementFrontmatter("# Just a heading\n\nNo frontmatter.")).toBeNull();
	});

	it("returns null when the frontmatter fails the statement schema", () => {
		const invalid = `---\nschema_version: 1\ntype: weekly\ntitle: ""\n---\n`;
		expect(parseStatementFrontmatter(invalid)).toBeNull();
	});

	it("preserves the draft flag so the caller can skip unpublished statements", () => {
		const draft = WEEKLY.replace("top_wallets: []", "top_wallets: []\ndraft: true");
		expect(parseStatementFrontmatter(draft)?.draft).toBe(true);
	});
});
