export type MarkdownEntry = {
	body?: string | undefined;
};

export function markdownResponse(entry: MarkdownEntry | undefined): Response {
	if (!entry || entry.body === undefined) {
		return new Response("Not Found", {
			status: 404,
			headers: { "content-type": "text/plain; charset=utf-8" },
		});
	}
	return new Response(entry.body, {
		status: 200,
		headers: { "content-type": "text/markdown; charset=utf-8" },
	});
}
