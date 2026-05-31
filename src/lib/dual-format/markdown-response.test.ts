import { markdownResponse } from "./markdown-response";

describe("markdownResponse", () => {
	it("returns 200 text/markdown for an entry with a body", async () => {
		const entry = { id: "demo", body: "# hello\n\nworld" };
		const response = markdownResponse(entry);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
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

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
		expect(await response.text()).toBe(entry.body);
	});
});
