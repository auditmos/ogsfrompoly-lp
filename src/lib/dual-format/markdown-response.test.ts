import YAML from "yaml";
import { findFullWalletAddresses } from "@/content/body-disclosure";
import { markdownResponse } from "./markdown-response";

// A realistic monthly statement — every schema field including `top_wallets`
// and the monthly-only `pnl` block — so the snapshot proves the LLM-facing
// `.md` surface carries every number the HTML shows (issue #28).
const MONTHLY_STATEMENT = {
	schema_version: 1,
	type: "monthly",
	title: "May 2026",
	summary: "612 alerts, hit rate 0.55.",
	period_start: "2026-05-01",
	period_end: "2026-05-31",
	bankroll_usd: 25000,
	alert_count: 612,
	hit_rate: 0.55,
	hypothetical_pnl_usd: 4210.5,
	categories: ["politics", "macro-finance"],
	top_wallets: [
		{ truncated_id: "wallet_a3f…", category: "politics", hypothetical_pnl_usd: 1820.25 },
		{ truncated_id: "wallet_9c1…", category: "macro-finance", hypothetical_pnl_usd: -340.75 },
	],
	draft: false,
	pnl: { revenue_usd: 3000, opex_usd: 1800, net_usd: 1200, runway_months: null },
} as const;

describe("markdownResponse", () => {
	it("returns 200 text/markdown for an entry with a body", async () => {
		const entry = { id: "demo", body: "# hello\n\nworld" };
		const response = markdownResponse(entry);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
	});

	it("prepends a YAML frontmatter block that round-trips to the entry data", async () => {
		const data = {
			type: "weekly",
			title: "Week of May 19, 2026",
			hit_rate: 0.58,
			top_wallets: [{ truncated_id: "wallet_a3f…", category: "politics" }],
		};
		const response = markdownResponse({ body: "## Strategy track record\n", data });
		const text = await response.text();

		const match = text.match(/^---\n([\s\S]*?)\n---\n/);
		expect(match).not.toBeNull();
		expect(YAML.parse((match as RegExpMatchArray)[1] as string)).toEqual(data);
	});

	it("response body byte-matches entry.body across multi-line + special chars", async () => {
		const body = [
			"# Statement — May 19–25, 2026",
			"",
			"> wallet_a3f8… — hit rate `0.58`",
			"",
			"Lines with trailing space:   ",
			"Unicode: π, ✓, 日本語",
			"Final line no trailing newline",
		].join("\n");

		const response = markdownResponse({ body });
		const received = await response.text();

		expect(received).toBe(body);
	});

	it("serves body-only with no frontmatter block when data is empty or absent", async () => {
		const body = "## Strategy track record\n\nProse only.\n";

		const noData = await markdownResponse({ body }).text();
		expect(noData).toBe(body);
		expect(noData.startsWith("---")).toBe(false);

		const emptyData = await markdownResponse({ body, data: {} }).text();
		expect(emptyData).toBe(body);
		expect(emptyData.startsWith("---")).toBe(false);
	});

	it("keeps the body byte-identical after the frontmatter block", async () => {
		const body = [
			"## Strategy track record — May 19–25",
			"",
			"> wallet_a3f8… — hit rate `0.58`",
			"Trailing space:   ",
			"Unicode: π, ✓, 日本語",
			"No trailing newline",
		].join("\n");
		const text = await markdownResponse({ body, data: { type: "weekly" } }).text();

		const body_ = text.replace(/^---\n[\s\S]*?\n---\n/, "");
		expect(body_).toBe(body);
	});

	it("returns 404 text/plain when the entry is undefined (not found)", async () => {
		const response = markdownResponse(undefined);

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
	});

	it("returns 404 when the entry has no body (non-markdown collection entry)", async () => {
		const response = markdownResponse({ body: undefined });

		expect(response.status).toBe(404);
	});

	// Deep-module invariant: the same helper handles any collection shape with
	// zero per-collection branching. Two fictional collections with disjoint
	// extra fields must produce identical-shape responses.
	const fixtures: Array<{ name: string; entry: { body: string } & Record<string, unknown> }> = [
		{
			name: "statements (weekly)",
			entry: {
				id: "2026-05-25-placeholder",
				body: "Weekly placeholder body\n",
				data: { type: "weekly", hit_rate: 0.58 },
			},
		},
		{
			name: "articles (fictional second collection)",
			entry: {
				id: "build-log-01",
				body: "# Build log entry\n\nProse here.\n",
				data: { series: "build-log", tags: ["infra"] },
			},
		},
	];

	it.each(fixtures)("handles $name with identical response shape", async ({ entry }) => {
		const response = markdownResponse(entry);
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
		// Same helper serializes each collection's disjoint `data` the same way:
		// a YAML frontmatter block that round-trips, then the untouched body.
		const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		expect(match).not.toBeNull();
		const [, frontmatter, body] = match as RegExpMatchArray;
		expect(YAML.parse(frontmatter as string)).toEqual(entry.data);
		expect(body).toBe(entry.body);
	});

	it("emits byte-identical output across repeated invocations", async () => {
		const body = "## Strategy track record\n\nBody.\n";
		const a = await markdownResponse({ body, data: MONTHLY_STATEMENT }).text();
		const b = await markdownResponse({ body, data: MONTHLY_STATEMENT }).text();

		expect(a).toBe(b);
	});

	it("locks the full monthly-statement .md surface as a reviewable snapshot", async () => {
		const body =
			"## Strategy track record\n\nNumbers in the frontmatter are mechanically derived.\n";
		const text = await markdownResponse({ body, data: MONTHLY_STATEMENT }).text();

		expect(text).toMatchInlineSnapshot(`
			"---
			alert_count: 612
			bankroll_usd: 25000
			categories:
			  - politics
			  - macro-finance
			draft: false
			hit_rate: 0.55
			hypothetical_pnl_usd: 4210.5
			period_end: 2026-05-31
			period_start: 2026-05-01
			pnl:
			  net_usd: 1200
			  opex_usd: 1800
			  revenue_usd: 3000
			  runway_months: null
			schema_version: 1
			summary: 612 alerts, hit rate 0.55.
			title: May 2026
			top_wallets:
			  - category: politics
			    hypothetical_pnl_usd: 1820.25
			    truncated_id: wallet_a3f…
			  - category: macro-finance
			    hypothetical_pnl_usd: -340.75
			    truncated_id: wallet_9c1…
			type: monthly
			---
			## Strategy track record

			Numbers in the frontmatter are mechanically derived.
			"
		`);
	});

	it("never leaks a full wallet address into the serialized frontmatter surface", async () => {
		const body = "## Strategy track record\n\nBody.\n";
		const text = await markdownResponse({ body, data: MONTHLY_STATEMENT }).text();

		expect(findFullWalletAddresses(text)).toEqual([]);

		// Positive control: the detector genuinely scans the serialized frontmatter,
		// so the assertion above is non-vacuous. A full EVM address placed in any
		// data field would surface — the schema is what keeps it out upstream.
		const leaky = await markdownResponse({
			body,
			data: { truncated_id: "0x1234567890abcdef1234567890abcdef12345678" },
		}).text();
		expect(findFullWalletAddresses(leaky)).toHaveLength(1);
	});
});
